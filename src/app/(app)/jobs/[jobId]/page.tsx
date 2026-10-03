import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EditIcon,
  LocationIcon,
  BriefcaseIcon,
  CalendarIcon,
  CandidatesIcon,
} from "@/components/ui/icons";
import { JobStatusActions } from "@/components/jobs/job-status-actions";

interface JobDetailsPageProps {
  params: Promise<{ jobId: string }>;
}

function getJobStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return { label: "Active Requisition", variant: "success" };
    case "ARCHIVED":
      return { label: "Archived", variant: "neutral" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const recruiter = await requireRecruiter();
  const { jobId } = await params;

  // Query the job strictly scoped to the authenticated recruiter
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      recruiterId: recruiter.id,
    },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  // Strict Multi-Tenant Authorization Check:
  // If job does not exist or belongs to another recruiter, return 404
  if (!job) {
    notFound();
  }

  const statusBadge = getJobStatusBadge(job.status);
  const applicantCount = job._count.applications;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={job.title}
        breadcrumbs={[
          { label: "Jobs", href: "/jobs" },
          { label: job.title },
        ]}
        action={
          <div className="flex items-center gap-3">
            <Link href={`/jobs/${job.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                icon={<EditIcon className="w-4 h-4" />}
              >
                Edit Requisition
              </Button>
            </Link>
            <JobStatusActions jobId={job.id} currentStatus={job.status} />
          </div>
        }
      />

      {/* Role Metadata & Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Status
          </span>
          <div className="mt-2">
            <Badge variant={statusBadge.variant} size="sm">
              {statusBadge.label}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Location
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
            <LocationIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location || "Remote / Unspecified"}</span>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Employment Type
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
            <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.employmentType || "Not specified"}</span>
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Applicants
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <CandidatesIcon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span>
              {applicantCount} {applicantCount === 1 ? "candidate" : "candidates"}
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Meta Information Row */}
      <Card className="bg-slate-50/70 border-slate-200/80">
        <CardContent className="p-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-6 flex-wrap">
              <span>
                <strong className="text-slate-700">Minimum Experience:</strong>{" "}
                {job.experienceMinYears !== null
                  ? `${job.experienceMinYears} ${job.experienceMinYears === 1 ? "year" : "years"}`
                  : "Flexible / Not specified"}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <strong className="text-slate-700">Created:</strong> {formatDate(job.createdAt)}
              </span>
              <span>
                <strong className="text-slate-700">Last Modified:</strong>{" "}
                {formatDate(job.updatedAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requisition Description Body */}
      <Card>
        <CardHeader>
          <CardTitle>Role Description & Requisition Criteria</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-normal">
            {job.description}
          </div>
        </CardContent>
      </Card>

      {/* Phase 7 Candidate Pipeline Note */}
      <Card className="bg-blue-50/40 border-blue-100">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-900 shrink-0">
              <CandidatesIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Candidate Pipeline
              </h4>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Resume ingestion and candidate evaluation for this requisition will be activated
                in <strong>Phase 7 (Resume Upload & Parsing)</strong>. You will be able to upload
                candidate resumes in PDF/DOCX formats directly to this requisition.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
