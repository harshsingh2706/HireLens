import React from "react";
import Link from "next/link";
import { requireRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CandidatesIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  PlusIcon,
} from "@/components/ui/icons";

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

export default async function CandidatesPage() {
  const recruiter = await requireRecruiter();

  const candidates = await prisma.candidate.findMany({
    where: {
      recruiterId: recruiter.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      applications: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      resumes: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Talent Pool"
        description="View and access uploaded candidate resumes across your active job openings."
        action={
          <Link href="/jobs">
            <Button variant="primary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
              Select Job to Upload
            </Button>
          </Link>
        }
      />

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12">
            <EmptyState
              icon={<CandidatesIcon className="w-10 h-10 text-slate-400" />}
              title="No candidates in talent pool"
              description="Upload candidate resumes in PDF or DOCX format to start building your candidate pipeline."
              action={
                <Link href="/jobs">
                  <Button variant="primary" size="sm" icon={<BriefcaseIcon className="w-3.5 h-3.5" />}>
                    View Jobs &amp; Upload
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>
                {candidates.length} {candidates.length === 1 ? "candidate record" : "candidate records"} in your talent pool
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200/80 text-[10px]">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Candidate</th>
                    <th className="py-3 px-4">Applied Position</th>
                    <th className="py-3 px-4">Resume File</th>
                    <th className="py-3 px-4">Application</th>
                    <th className="py-3 px-4">Processing</th>
                    <th className="py-3 px-4 text-right sm:pr-6">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((cand) => {
                    const primaryApp = cand.applications[0];
                    const resume = cand.resumes[0];
                    const appBadge = getApplicationBadge(primaryApp?.status || "NEW");
                    const isStructured = Boolean(cand.structuredData);

                    return (
                      <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
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

                        <td className="py-3.5 px-4">
                          {primaryApp?.job ? (
                            <Link
                              href={`/jobs/${primaryApp.job.id}`}
                              className="font-medium text-slate-800 hover:text-blue-900 truncate block max-w-xs"
                            >
                              {primaryApp.job.title}
                            </Link>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>

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
                                  title="View uploaded document"
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

                        <td className="py-3.5 px-4">
                          <Badge variant={appBadge.variant} size="sm">
                            {appBadge.label}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          {isStructured ? (
                            <Badge variant="success" size="sm">
                              AI Structured
                            </Badge>
                          ) : resume?.processingStatus === "COMPLETED" ? (
                            <Badge variant="neutral" size="sm">
                              Text Extracted
                            </Badge>
                          ) : resume?.processingStatus === "PROCESSING" ? (
                            <Badge variant="warning" size="sm">
                              Processing
                            </Badge>
                          ) : resume?.processingStatus === "FAILED" ? (
                            <Badge variant="destructive" size="sm" title={resume.errorMessage || "Extraction failed"}>
                              Extraction Failed
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Pending
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right sm:pr-6 text-slate-500 whitespace-nowrap">
                          {formatDate(cand.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
