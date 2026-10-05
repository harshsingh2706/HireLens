"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireRecruiter, UnauthorizedError } from "@/lib/auth-guard";
import {
  validateResumeBuffer,
  saveResumeBuffer,
  deleteResumeFile,
  getResumeFileBuffer,
} from "@/lib/storage";
import { extractTextFromBuffer } from "@/lib/text-extraction";
import { type AllowedExtension } from "@/lib/storage-constants";
import { structureResumeText, isOpenAIConfigured } from "@/lib/ai/openai-client";
import { persistStructuredResume } from "@/lib/ai/persist-structured-resume";

export interface FileUploadResult {
  fileName: string;
  success: boolean;
  candidateId?: string;
  candidateName?: string;
  resumeId?: string;
  processingStatus?: string;
  extractedTextLength?: number;
  error?: string;
}

export interface UploadBatchResult {
  success: boolean;
  totalUploaded: number;
  totalFailed: number;
  results: FileUploadResult[];
  error?: string;
}

export interface ExtractionActionResult {
  success: boolean;
  textLength?: number;
  error?: string;
}

export interface StructuringActionResult {
  success: boolean;
  candidateId?: string;
  candidateName?: string;
  error?: string;
  isConfigured?: boolean;
}

/**
 * Derives a clean, provisional candidate label from the file name.
 * We explicitly mark it as provisional so it is never confused with verified LLM-extracted data.
 */
function deriveProvisionalName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const nameWithoutExt = lastDot > 0 ? fileName.substring(0, lastDot) : "";
  const base = path.basename(nameWithoutExt)
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = base.toLowerCase();
  if (
    !base ||
    base.length < 2 ||
    normalized === "pdf" ||
    normalized === "docx" ||
    normalized === "resume" ||
    normalized === "cv"
  ) {
    return "Candidate (Provisional)";
  }

  return `Candidate (${base})`;
}

/**
 * Processes text extraction for a specific resume, updating its database status.
 * Reusable for both post-upload extraction and manual retry actions.
 */
export async function processResumeTextExtraction(
  resumeId: string,
  recruiterId: string
): Promise<ExtractionActionResult> {
  try {
    // 1. Authorize: resume must belong to a candidate owned by this recruiter
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        candidate: {
          recruiterId,
        },
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        candidate: {
          select: {
            applications: {
              select: { jobId: true },
            },
          },
        },
      },
    });

    if (!resume) {
      return {
        success: false,
        error: "Resume record not found or access denied.",
      };
    }

    // 2. Transition status to PROCESSING
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        processingStatus: "PROCESSING",
        errorMessage: null,
      },
    });

    // 3. Read stored resume file buffer
    const buffer = await getResumeFileBuffer(resume.fileUrl);
    if (!buffer) {
      const err = "Stored resume file could not be read from disk.";
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          processingStatus: "FAILED",
          errorMessage: err,
        },
      });
      return { success: false, error: err };
    }

    // 4. Extract and normalize text
    const ext = path.extname(resume.fileName).toLowerCase() as AllowedExtension;
    const extraction = await extractTextFromBuffer(buffer, ext);

    // 5. Update database with extraction result
    if (extraction.success && extraction.text) {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          extractedText: extraction.text,
          processingStatus: "COMPLETED",
          errorMessage: null,
        },
      });

      // Revalidate affected job pages
      resume.candidate.applications.forEach((app) => {
        revalidatePath(`/jobs/${app.jobId}`);
      });
      revalidatePath("/candidates");

      return {
        success: true,
        textLength: extraction.text.length,
      };
    } else {
      const err = extraction.error || "Failed to extract text from document.";
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          extractedText: null,
          processingStatus: "FAILED",
          errorMessage: err,
        },
      });

      resume.candidate.applications.forEach((app) => {
        revalidatePath(`/jobs/${app.jobId}`);
      });
      revalidatePath("/candidates");

      return {
        success: false,
        error: err,
      };
    }
  } catch (error) {
    console.error(`Error in processResumeTextExtraction for resume ${resumeId}:`, error);
    const err = "An unexpected error occurred during resume text extraction.";
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        processingStatus: "FAILED",
        errorMessage: err,
      },
    }).catch(() => null);

    return {
      success: false,
      error: err,
    };
  }
}

/**
 * Server Action: Retries or triggers text extraction for an existing resume.
 */
export async function extractResumeTextAction(
  resumeId: string
): Promise<ExtractionActionResult> {
  try {
    const recruiter = await requireRecruiter(false);
    return await processResumeTextExtraction(resumeId, recruiter.id);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: "Authentication required to extract resume text.",
      };
    }
    console.error("extractResumeTextAction error:", error);
    return {
      success: false,
      error: "Unable to process text extraction. Please try again.",
    };
  }
}

/**
 * Server Action: Triggers AI structuring on an extracted candidate resume.
 * Transforms raw text into validated structured entities and updates Candidate and Skill records.
 */
export async function structureCandidateResumeAction(
  candidateId: string
): Promise<StructuringActionResult> {
  try {
    const recruiter = await requireRecruiter(false);

    // 1. Find candidate and verify ownership
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        recruiterId: recruiter.id,
      },
      include: {
        resumes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        applications: {
          select: { jobId: true },
        },
      },
    });

    if (!candidate) {
      return {
        success: false,
        error: "Candidate record not found or access denied.",
      };
    }

    const latestResume = candidate.resumes[0];
    if (!latestResume || !latestResume.extractedText) {
      return {
        success: false,
        error: "No extracted resume text found. Please extract text from document first.",
      };
    }

    // 2. Run LLM structuring
    const structResult = await structureResumeText(latestResume.extractedText);
    if (!structResult.success || !structResult.data) {
      return {
        success: false,
        isConfigured: structResult.isConfigured,
        error: structResult.error || "Failed to structure resume with AI.",
      };
    }

    // 3. Persist structured entities into PostgreSQL
    const updated = await persistStructuredResume(
      candidateId,
      recruiter.id,
      structResult.data
    );

    // 4. Revalidate cache
    revalidatePath("/candidates");
    revalidatePath(`/candidates/${candidateId}`);
    candidate.applications.forEach((app) => {
      revalidatePath(`/jobs/${app.jobId}`);
    });

    return {
      success: true,
      candidateId: updated.id,
      candidateName: updated.name,
      isConfigured: true,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: "Authentication required to structure candidate resumes.",
      };
    }
    console.error("structureCandidateResumeAction error:", error);
    return {
      success: false,
      error: "An unexpected error occurred while structuring the resume.",
    };
  }
}

/**
 * Server Action: Uploads one or more candidate resumes for a specific job.
 * Enforces authenticated recruiter ownership and transactional database insertion.
 * Automatically runs the text extraction pipeline on upload.
 */
export async function uploadResumesAction(
  jobId: string,
  formData: FormData
): Promise<UploadBatchResult> {
  try {
    const recruiter = await requireRecruiter(false);

    // Verify job exists and belongs strictly to this recruiter
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId: recruiter.id,
      },
      select: {
        id: true,
        status: true,
        title: true,
      },
    });

    if (!job) {
      return {
        success: false,
        totalUploaded: 0,
        totalFailed: 0,
        results: [],
        error: "Job requisition not found or access denied.",
      };
    }

    if (job.status === "ARCHIVED") {
      return {
        success: false,
        totalUploaded: 0,
        totalFailed: 0,
        results: [],
        error: "Cannot upload candidates to an archived job opening. Please restore it first.",
      };
    }

    const files = formData.getAll("resumes") as File[];

    if (!files || files.length === 0) {
      return {
        success: false,
        totalUploaded: 0,
        totalFailed: 0,
        results: [],
        error: "No resume files selected for upload.",
      };
    }

    const results: FileUploadResult[] = [];
    const seenHashesInBatch = new Set<string>();

    for (const file of files) {
      const originalName = file.name || "unnamed_resume";

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Validate file format, size, and magic bytes
        const validation = validateResumeBuffer(originalName, buffer);
        if (!validation.isValid) {
          results.push({
            fileName: originalName,
            success: false,
            error: validation.error || "File validation failed.",
          });
          continue;
        }

        // 2. Prevent accidental duplicate files within the exact same upload batch
        const batchHash = `${validation.cleanFileName}-${buffer.length}`;
        if (seenHashesInBatch.has(batchHash)) {
          results.push({
            fileName: originalName,
            success: false,
            error: "Duplicate file detected in the same upload batch.",
          });
          continue;
        }
        seenHashesInBatch.add(batchHash);

        // 3. Check for existing identical resume file already uploaded for this job
        const existingApplicationWithFile = await prisma.application.findFirst({
          where: {
            jobId: job.id,
            candidate: {
              recruiterId: recruiter.id,
              resumes: {
                some: {
                  fileName: validation.cleanFileName,
                  fileSize: buffer.length,
                },
              },
            },
          },
          select: { id: true },
        });

        if (existingApplicationWithFile) {
          results.push({
            fileName: originalName,
            success: false,
            error: "An identical resume file has already been uploaded for this job opening.",
          });
          continue;
        }

        // 4. Save file to secure local disk storage
        const saved = await saveResumeBuffer(
          buffer,
          validation.cleanFileName,
          validation.extension,
          validation.mimeType
        );

        // 5. Create Candidate, Resume, and Application inside a database transaction
        try {
          const provisionalName = deriveProvisionalName(validation.cleanFileName);

          const { candidate, resume } = await prisma.$transaction(async (tx) => {
            const newCandidate = await tx.candidate.create({
              data: {
                recruiterId: recruiter.id,
                name: provisionalName,
              },
            });

            const newResume = await tx.resume.create({
              data: {
                candidateId: newCandidate.id,
                fileName: validation.cleanFileName,
                fileSize: saved.fileSize,
                mimeType: saved.mimeType,
                fileUrl: saved.storageKey,
                processingStatus: "PENDING",
              },
            });

            await tx.application.create({
              data: {
                jobId: job.id,
                candidateId: newCandidate.id,
                status: "NEW",
              },
            });

            return { candidate: newCandidate, resume: newResume };
          });

          // 6. Execute text extraction immediately on the in-memory buffer
          const extraction = await extractTextFromBuffer(buffer, validation.extension);

          let finalStatus = "PENDING";
          let finalExtractedLength: number | undefined;

          if (extraction.success && extraction.text) {
            finalStatus = "COMPLETED";
            finalExtractedLength = extraction.text.length;
            await prisma.resume.update({
              where: { id: resume.id },
              data: {
                extractedText: extraction.text,
                processingStatus: "COMPLETED",
                errorMessage: null,
              },
            });

            // Automatically attempt AI structuring if provider is configured
            if (isOpenAIConfigured()) {
              try {
                const structRes = await structureResumeText(extraction.text);
                if (structRes.success && structRes.data) {
                  const updatedCand = await persistStructuredResume(
                    candidate.id,
                    recruiter.id,
                    structRes.data
                  );
                  candidate.name = updatedCand.name;
                }
              } catch (aiErr) {
                console.warn("AI structuring during upload encountered error (non-fatal):", aiErr);
              }
            }
          } else {
            finalStatus = "FAILED";
            await prisma.resume.update({
              where: { id: resume.id },
              data: {
                extractedText: null,
                processingStatus: "FAILED",
                errorMessage: extraction.error || "Unable to extract text from document.",
              },
            });
          }

          results.push({
            fileName: originalName,
            success: true,
            candidateId: candidate.id,
            candidateName: candidate.name,
            resumeId: resume.id,
            processingStatus: finalStatus,
            extractedTextLength: finalExtractedLength,
          });
        } catch (dbError) {
          // If database transaction failed, cleanup saved file on disk
          await deleteResumeFile(saved.storageKey);
          console.error("Database transaction error creating candidate:", dbError);
          results.push({
            fileName: originalName,
            success: false,
            error: "Failed to create candidate database record.",
          });
        }
      } catch (fileError) {
        console.error(`Error processing file ${originalName}:`, fileError);
        results.push({
          fileName: originalName,
          success: false,
          error: "An unexpected error occurred while processing this file.",
        });
      }
    }

    const totalUploaded = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    // Revalidate affected views
    if (totalUploaded > 0) {
      revalidatePath(`/jobs/${jobId}`);
      revalidatePath("/jobs");
      revalidatePath("/dashboard");
      revalidatePath("/candidates");
    }

    return {
      success: totalUploaded > 0,
      totalUploaded,
      totalFailed,
      results,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        totalUploaded: 0,
        totalFailed: 0,
        results: [],
        error: "Authentication required to upload candidate resumes.",
      };
    }
    console.error("uploadResumesAction error:", error);
    return {
      success: false,
      totalUploaded: 0,
      totalFailed: 0,
      results: [],
      error: "Unable to process upload. Please try again.",
    };
  }
}
