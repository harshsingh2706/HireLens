"use client";

import React from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CandidatesIcon, DocumentTextIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/formatters";

export interface JobCandidateItem {
  id: string;
  name: string;
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

function getProcessingBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "PENDING":
      return { label: "Pending Extraction", variant: "neutral" };
    case "PROCESSING":
      return { label: "Extracting Text", variant: "warning" };
    case "COMPLETED":
      return { label: "Text Extracted", variant: "success" };
    case "FAILED":
      return { label: "Extraction Failed", variant: "destructive" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export function JobCandidatesList({ candidates, jobTitle }: JobCandidatesListProps) {
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
                <th className="py-3 px-4">Processing</th>
                <th className="py-3 px-4">AI Analysis</th>
                <th className="py-3 px-4 text-right sm:pr-6">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((cand) => {
                const appBadge = getApplicationBadge(cand.application.status);
                const procBadge = getProcessingBadge(
                  cand.resume?.processingStatus || "PENDING"
                );

                return (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Candidate Name / Provisional Label */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-slate-900 truncate max-w-xs">
                        {cand.name}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Provisional ID &bull; {cand.id.slice(0, 10)}...
                      </span>
                    </td>

                    {/* Resume Document Link */}
                    <td className="py-3.5 px-4">
                      {cand.resume ? (
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-4 h-4 text-blue-900 shrink-0" />
                          <div className="min-w-0">
                            <a
                              href={`/api/resumes/${cand.resume.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-900 hover:underline truncate block max-w-[160px]"
                              title="View resume document"
                            >
                              {cand.resume.fileName}
                            </a>
                            <span className="text-[10px] text-slate-400">
                              {formatFileSize(cand.resume.fileSize)}
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

                    {/* Resume Processing Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <Badge variant={procBadge.variant} size="sm">
                          {procBadge.label}
                        </Badge>
                        <span className="text-[10px] text-slate-400 block">
                          Phase 8 text parsing
                        </span>
                      </div>
                    </td>

                    {/* AI Analysis (Explicitly Pending, No Fake Data) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <Badge variant="neutral" size="sm">
                          Pending
                        </Badge>
                        <span className="text-[10px] text-slate-400 block">
                          Phase 9 extraction
                        </span>
                      </div>
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
  );
}
