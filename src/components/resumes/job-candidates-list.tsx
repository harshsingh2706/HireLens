"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CandidatesIcon, DocumentTextIcon, AlertCircleIcon, SparklesIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/formatters";
import { extractResumeTextAction, structureCandidateResumeAction } from "@/lib/actions/resume-actions";

export interface JobCandidateItem {
  id: string;
  name: string;
  headline?: string | null;
  experienceYears?: number | null;
  isStructured?: boolean;
  skillsCount?: number;
  application: {
    id: string;
    status: string;
    createdAt: Date;
  };
  resume?: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    processingStatus: string;
    extractedText: string | null;
    errorMessage: string | null;
  } | null;
}

interface JobCandidatesListProps {
  candidates: JobCandidateItem[];
  jobTitle: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getApplicationBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "NEW":
      return { label: "New", variant: "primary" };
    case "REVIEWING":
      return { label: "Reviewing", variant: "warning" };
    case "SHORTLISTED":
      return { label: "Shortlisted", variant: "success" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export function JobCandidatesList({ candidates, jobTitle }: JobCandidatesListProps) {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [structuringId, setStructuringId] = useState<string | null>(null);
  const [structuringError, setStructuringError] = useState<{ id: string; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // State for inspecting extracted text in a modal
  const [previewResume, setPreviewResume] = useState<{
    fileName: string;
    candidateName: string;
    extractedText: string;
  } | null>(null);

  function handleRetryExtraction(resumeId: string) {
    setRetryingId(resumeId);

    startTransition(async () => {
      await extractResumeTextAction(resumeId);
      setRetryingId(null);
      router.refresh();
    });
  }

  function handleStructureCandidate(candidateId: string) {
    setStructuringId(candidateId);
    setStructuringError(null);

    startTransition(async () => {
      const res = await structureCandidateResumeAction(candidateId);
      setStructuringId(null);
      if (!res.success) {
        setStructuringError({ id: candidateId, msg: res.error || "Structuring failed." });
      } else {
        router.refresh();
      }
    });
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-10">
          <EmptyState
            icon={<CandidatesIcon className="w-8 h-8 text-slate-400" />}
            title="No candidate resumes uploaded yet"
            description={`Upload candidate resumes above in PDF or DOCX format to start structuring your candidate pipeline for ${jobTitle}.`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Candidate Pipeline</CardTitle>
            <CardDescription>
              {candidates.length} {candidates.length === 1 ? "candidate" : "candidates"} associated with this requisition
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200/80 text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Candidate</th>
                  <th className="py-3 px-4">Resume Document</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Text Extraction</th>
                  <th className="py-3 px-4">AI Analysis</th>
                  <th className="py-3 px-4 text-right sm:pr-6">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((cand) => {
                  const appBadge = getApplicationBadge(cand.application.status);
                  const resume = cand.resume;
                  const isRetrying = retryingId === resume?.id && isPending;

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Candidate Name / Profile Link */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <Link
                          href={`/candidates/${cand.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-900 hover:underline truncate max-w-xs block"
                        >
                          {cand.name}
                        </Link>
                        {cand.headline ? (
                          <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                            {cand.headline}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Provisional ID &bull; {cand.id.slice(0, 10)}...
                          </span>
                        )}
                      </td>

                      {/* Resume Document Link */}
                      <td className="py-3.5 px-4">
                        {resume ? (
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-blue-900 shrink-0" />
                            <div className="min-w-0">
                              <a
                                href={`/api/resumes/${resume.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-900 hover:underline truncate block max-w-[160px]"
                                title="View original document in new tab"
                              >
                                {resume.fileName}
                              </a>
                              <span className="text-[10px] text-slate-400">
                                {formatFileSize(resume.fileSize)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No file</span>
                        )}
                      </td>

                      {/* Application Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={appBadge.variant} size="sm">
                          {appBadge.label}
                        </Badge>
                      </td>

                      {/* Resume Processing / Text Extraction Status */}
                      <td className="py-3.5 px-4">
                        {resume ? (
                          <div className="space-y-1">
                            {resume.processingStatus === "COMPLETED" && (
                              <div className="flex items-center gap-2">
                                <Badge variant="success" size="sm">
                                  Text Extracted
                                </Badge>
                                {resume.extractedText && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewResume({
                                        fileName: resume.fileName,
                                        candidateName: cand.name,
                                        extractedText: resume.extractedText || "",
                                      })
                                    }
                                    className="text-[11px] text-blue-900 hover:underline font-medium cursor-pointer"
                                    title="View normalized extracted text"
                                  >
                                    View text ({resume.extractedText.length} chars)
                                  </button>
                                )}
                              </div>
                            )}

                            {resume.processingStatus === "PROCESSING" && (
                              <Badge variant="warning" size="sm" className="animate-pulse">
                                Extracting Text...
                              </Badge>
                            )}

                            {resume.processingStatus === "PENDING" && (
                              <div className="flex items-center gap-2">
                                <Badge variant="neutral" size="sm">
                                  Pending
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetryExtraction(resume.id)}
                                  isLoading={isRetrying}
                                  className="text-[10px] h-6 px-1.5"
                                >
                                  Extract
                                </Button>
                              </div>
                            )}

                            {resume.processingStatus === "FAILED" && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                                    <AlertCircleIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    <span className="text-[11px]">Extraction Failed</span>
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetryExtraction(resume.id)}
                                    isLoading={isRetrying}
                                    className="text-[10px] h-6 px-2"
                                  >
                                    Retry
                                  </Button>
                                </div>
                                {resume.errorMessage && (
                                  <p
                                    className="text-[10px] text-red-500 max-w-[220px] leading-tight truncate"
                                    title={resume.errorMessage}
                                  >
                                    {resume.errorMessage}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* AI Structured Entities */}
                      <td className="py-3.5 px-4">
                        {cand.isStructured ? (
                          <div className="space-y-1">
                            <Badge variant="success" size="sm" className="gap-1">
                              <SparklesIcon className="w-3 h-3 text-emerald-600" />
                              Structured
                            </Badge>
                            <Link
                              href={`/candidates/${cand.id}`}
                              className="text-[11px] text-blue-900 hover:underline font-medium block"
                            >
                              View profile {cand.skillsCount ? `(${cand.skillsCount} skills)` : ""}
                            </Link>
                          </div>
                        ) : resume?.extractedText ? (
                          <div className="space-y-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStructureCandidate(cand.id)}
                              isLoading={structuringId === cand.id && isPending}
                              icon={<SparklesIcon className="w-3 h-3 text-amber-500" />}
                              className="text-[11px] h-6 px-2"
                            >
                              Structure AI
                            </Button>
                            {structuringError?.id === cand.id && (
                              <p className="text-[10px] text-red-500 max-w-[180px] leading-tight" title={structuringError.msg}>
                                {structuringError.msg}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Awaiting text
                          </span>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-4 text-right sm:pr-6 text-slate-500 whitespace-nowrap">
                        {formatDate(cand.application.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal for viewing normalized extracted text */}
      <Modal
        isOpen={Boolean(previewResume)}
        onClose={() => setPreviewResume(null)}
        title={previewResume ? `Extracted Text — ${previewResume.fileName}` : "Extracted Text"}
        description={
          previewResume
            ? `Normalized document text for ${previewResume.candidateName}. Ready for Phase 9 AI skill and qualification extraction.`
            : ""
        }
        maxWidth="lg"
      >
        {previewResume && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-h-[50vh] overflow-y-auto">
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {previewResume.extractedText}
              </pre>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>{previewResume.extractedText.length} characters extracted</span>
              <Button variant="outline" size="sm" onClick={() => setPreviewResume(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
