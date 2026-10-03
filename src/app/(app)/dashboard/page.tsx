import React from "react";
import Link from "next/link";
import { requireRecruiter } from "@/lib/auth-guard";
import { getDashboardData } from "@/lib/dashboard-queries";
import { formatDate, formatNumber, getTimeGreeting } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobsIcon, CandidatesIcon, PlusIcon, ChevronRightIcon } from "@/components/ui/icons";

function getJobStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return { label: "Active", variant: "success" };
    case "DRAFT":
      return { label: "Draft", variant: "neutral" };
    case "CLOSED":
    case "ARCHIVED":
      return { label: "Closed", variant: "neutral" };
    default:
      return { label: status, variant: "neutral" };
  }
}

function getApplicationStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "NEW":
      return { label: "New", variant: "primary" };
    case "REVIEWING":
      return { label: "Reviewing", variant: "warning" };
    case "SHORTLISTED":
      return { label: "Shortlisted", variant: "success" };
    case "REJECTED":
      return { label: "Rejected", variant: "destructive" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export default async function DashboardPage() {
  const recruiter = await requireRecruiter();
  const dashboardData = await getDashboardData(recruiter.id);

  const { metrics, recentJobs, recentCandidates, hasAnyJobs } = dashboardData;
  const greeting = `${getTimeGreeting()}, ${recruiter.name}`;

  return (
    <div className="space-y-6">
      {/* Top Greeting & Main Action */}
      <PageHeader
        title={greeting}
        description="Here's an overview of your active recruitment pipeline and candidate matches."
        action={
          <Link href="/jobs">
            <Button variant="primary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
              Create Job
            </Button>
          </Link>
        }
      />

      {/* Summary Metrics Row (Real Database Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Jobs
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(metrics.activeJobsCount)}
            </span>
            <span className="text-xs text-slate-400 font-medium">open positions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Currently accepting candidates</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Candidates
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(metrics.totalCandidatesCount)}
            </span>
            <span className="text-xs text-slate-400 font-medium">in talent pool</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Scoped to your organization</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Candidates to Review
            </span>
            {metrics.toReviewCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(metrics.toReviewCount)}
            </span>
            <span className="text-xs text-slate-400 font-medium">pending review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">New & in-review applications</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Shortlisted Candidates
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(metrics.shortlistedCount)}
            </span>
            <span className="text-xs text-slate-400 font-medium">ready for interview</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Passed match criteria</p>
        </Card>
      </div>

      {/* Main Grid: Recent Jobs & Recent Candidate Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Job Openings</CardTitle>
              <CardDescription>Latest positions created in your pipeline</CardDescription>
            </div>
            {recentJobs.length > 0 && (
              <Link href="/jobs">
                <Button variant="ghost" size="sm">
                  View all ({formatNumber(metrics.activeJobsCount)})
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {recentJobs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentJobs.map((job) => {
                  const statusBadge = getJobStatusBadge(job.status);
                  return (
                    <div
                      key={job.id}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <Link
                          href="/jobs"
                          className="text-sm font-semibold text-slate-900 hover:text-blue-900 truncate block transition-colors"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {job.location && <span>{job.location} &bull;</span>}
                          {job.employmentType && <span>{job.employmentType} &bull;</span>}
                          <span>Posted {formatDate(job.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-slate-600 hidden sm:inline-block">
                          {job.candidateCount} {job.candidateCount === 1 ? "applicant" : "applicants"}
                        </span>
                        <Badge variant={statusBadge.variant} size="sm">
                          {statusBadge.label}
                        </Badge>
                        <Link
                          href="/jobs"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="View job"
                          aria-label={`View ${job.title}`}
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={<JobsIcon className="w-8 h-8 text-slate-400" />}
                  title="No jobs yet"
                  description="Create your first job description to start structuring role requirements and matching candidate resumes."
                  action={
                    <Link href="/jobs">
                      <Button variant="primary" size="sm" icon={<PlusIcon className="w-3.5 h-3.5" />}>
                        Create Job
                      </Button>
                    </Link>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Candidate Applications Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Candidate Activity</CardTitle>
              <CardDescription>Recent applicants and match status updates</CardDescription>
            </div>
            {recentCandidates.length > 0 && (
              <Link href="/candidates">
                <Button variant="ghost" size="sm">
                  View all ({formatNumber(metrics.totalCandidatesCount)})
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {recentCandidates.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentCandidates.map((cand) => {
                  const statusBadge = getApplicationStatusBadge(cand.status);
                  return (
                    <div
                      key={cand.id}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <Link
                          href="/candidates"
                          className="text-sm font-semibold text-slate-900 hover:text-blue-900 truncate block transition-colors"
                        >
                          {cand.candidateName}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                          <span>Applied to</span>
                          <span className="font-medium text-slate-600 truncate">
                            {cand.jobTitle}
                          </span>
                          <span>&bull; {formatDate(cand.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge variant={statusBadge.variant} size="sm">
                          {statusBadge.label}
                        </Badge>
                        <Link
                          href="/candidates"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="View candidate"
                          aria-label={`View ${cand.candidateName}`}
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={<CandidatesIcon className="w-8 h-8 text-slate-400" />}
                  title={hasAnyJobs ? "No candidates yet" : "No candidate activity"}
                  description={
                    hasAnyJobs
                      ? "Upload candidate resumes to start building your candidate pool and matching qualifications."
                      : "Create your first job opening to begin receiving and matching candidate resumes."
                  }
                  action={
                    hasAnyJobs ? (
                      <Link href="/candidates">
                        <Button variant="secondary" size="sm">
                          View Candidates
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/jobs">
                        <Button variant="primary" size="sm" icon={<PlusIcon className="w-3.5 h-3.5" />}>
                          Create First Job
                        </Button>
                      </Link>
                    )
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recruiter Intelligence Workflow Note */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                Recruitment Intelligence Pipeline
              </span>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                HireLens operates on deterministic skill verification and semantic search. When resumes
                are uploaded, qualifications are extracted and cross-referenced with your job criteria
                to produce explainable matching evidence.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/jobs">
                <Button variant="outline" size="sm">
                  Explore Jobs &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
