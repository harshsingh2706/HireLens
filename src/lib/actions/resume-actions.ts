"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireRecruiter, UnauthorizedError } from "@/lib/auth-guard";
import {
  validateResumeBuffer,
  saveResumeBuffer,
  deleteResumeFile,
} from "@/lib/storage";

export interface FileUploadResult {
  fileName: string;
  success: boolean;
  candidateId?: string;
  candidateName?: string;
  resumeId?: string;
  error?: string;
}

export interface UploadBatchResult {
  success: boolean;
  totalUploaded: number;
  totalFailed: number;
  results: FileUploadResult[];
  error?: string;
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
 * Server Action: Uploads one or more candidate resumes for a specific job.
 * Enforces authenticated recruiter ownership and transactional database insertion.
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
                // Email, phone, skills, experience remain null until extracted in Phase 8-9
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

          results.push({
            fileName: originalName,
            success: true,
            candidateId: candidate.id,
            candidateName: candidate.name,
            resumeId: resume.id,
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
