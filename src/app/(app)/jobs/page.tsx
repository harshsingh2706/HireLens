import React from "react";
import Link from "next/link";
import { requireRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PlusIcon,
  JobsIcon,
  ChevronRightIcon,
  LocationIcon,
  BriefcaseIcon,
  CalendarIcon,
  EditIcon,
} from "@/components/ui/icons";

interface JobsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getJobStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return { label: "Active", variant: "success" };
    case "ARCHIVED":
      return { label: "Archived", variant: "neutral" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const recruiter = await requireRecruiter();
  const resolvedParams = await searchParams;

  const currentTab = (
    typeof resolvedParams.status === "string" ? resolvedParams.status.toUpperCase() : "ACTIVE"
  );
  const isArchivedTab = currentTab === "ARCHIVED";

  // Query counts for tabs and jobs list strictly scoped to the authenticated recruiter
  const [activeCount, archivedCount, jobs] = await Promise.all([
    prisma.job.count({
      where: {
        recruiterId: recruiter.id,
        status: "ACTIVE",
      },
    }),
    prisma.job.count({
      where: {
        recruiterId: recruiter.id,
        status: "ARCHIVED",
      },
    }),
    prisma.job.findMany({
      where: {
        recruiterId: recruiter.id,
        status: isArchivedTab ? "ARCHIVED" : "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
  ]);

  const totalAllJobs = activeCount + archivedCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings"
        description="Manage your active job requisitions, role criteria, and candidate applicant pipelines."
        action={
          <Link href="/jobs/new">
            <Button variant="primary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
              Create Job
            </Button>
          </Link>
        }
      />

      {/* Primary Empty State if user has zero jobs in total */}
      {totalAllJobs === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12">
            <EmptyState
              icon={<JobsIcon className="w-10 h-10 text-slate-400" />}
              title="No jobs yet"
              description="Create your first job to start building your candidate pipeline."
              action={
                <Link href="/jobs/new">
                  <Button variant="primary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
                    Create Job
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-6 -mb-px">
              <Link
                href="/jobs?status=ACTIVE"
                className={`pb-3 text-xs font-semibold inline-flex items-center gap-2 border-b-2 transition-colors ${
                  !isArchivedTab
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Active Openings</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    !isArchivedTab
                      ? "bg-blue-100 text-blue-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {activeCount}
                </span>
              </Link>

              <Link
                href="/jobs?status=ARCHIVED"
                className={`pb-3 text-xs font-semibold inline-flex items-center gap-2 border-b-2 transition-colors ${
                  isArchivedTab
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Archived</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isArchivedTab
                      ? "bg-blue-100 text-blue-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {archivedCount}
                </span>
              </Link>
            </div>

            <span className="text-xs text-slate-400 hidden sm:inline-block pb-3">
              Showing {jobs.length} {jobs.length === 1 ? "position" : "positions"}
            </span>
          </div>

          {/* Jobs List / Empty Tab State */}
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-10">
                <EmptyState
                  icon={<JobsIcon className="w-8 h-8 text-slate-400" />}
                  title={isArchivedTab ? "No archived jobs" : "No active jobs"}
                  description={
                    isArchivedTab
                      ? "Jobs you archive will be stored here for future reference or reactivation."
                      : "You have no active job postings. Create a new job requisition to resume candidate matching."
                  }
                  action={
                    !isArchivedTab ? (
                      <Link href="/jobs/new">
                        <Button variant="primary" size="sm" icon={<PlusIcon className="w-3.5 h-3.5" />}>
                          Create Job
                        </Button>
                      </Link>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const statusBadge = getJobStatusBadge(job.status);
                const applicantCount = job._count.applications;

                return (
                  <Card
                    key={job.id}
                    className="hover:border-slate-300 hover:shadow-xs transition-all duration-150"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Job Information */}
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <Link
                              href={`/jobs/${job.id}`}
                              className="text-base font-semibold text-slate-900 hover:text-blue-900 transition-colors"
                            >
                              {job.title}
                            </Link>
                            <Badge variant={statusBadge.variant} size="sm">
                              {statusBadge.label}
                            </Badge>
                          </div>

                          {/* Metadata row */}
                          <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-xs text-slate-500">
                            {job.location && (
                              <span className="flex items-center gap-1.5">
                                <LocationIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{job.location}</span>
                              </span>
                            )}

                            {job.employmentType && (
                              <span className="flex items-center gap-1.5">
                                <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{job.employmentType}</span>
                              </span>
                            )}

                            {job.experienceMinYears !== null && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700">
                                  {job.experienceMinYears}+
                                </span>
                                <span>yrs exp</span>
                              </span>
                            )}

                            <span className="flex items-center gap-1.5 text-slate-400">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Posted {formatDate(job.createdAt)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right Actions & Applicant Count */}
                        <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          <div className="text-right pr-2">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {applicantCount} {applicantCount === 1 ? "applicant" : "applicants"}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              in pipeline
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link href={`/jobs/${job.id}/edit`}>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<EditIcon className="w-3.5 h-3.5" />}
                              >
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/jobs/${job.id}`}>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<ChevronRightIcon className="w-3.5 h-3.5" />}
                              >
                                View Requisition
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
