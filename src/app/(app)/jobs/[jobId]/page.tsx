import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EditIcon,
  LocationIcon,
  BriefcaseIcon,
  CalendarIcon,
  CandidatesIcon,
  UploadCloudIcon,
} from "@/components/ui/icons";
import { JobStatusActions } from "@/components/jobs/job-status-actions";
import { ResumeDropzone } from "@/components/resumes/resume-dropzone";
import { JobCandidatesList, type JobCandidateItem } from "@/components/resumes/job-candidates-list";

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

  // Query the job and all associated applications strictly scoped to the authenticated recruiter
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      recruiterId: recruiter.id,
    },
    include: {
      _count: {
        select: { applications: true },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: {
            include: {
              resumes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
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

  const candidateItems: JobCandidateItem[] = job.applications.map((app) => ({
    id: app.candidate.id,
    name: app.candidate.name,
    application: {
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
    },
    resume: app.candidate.resumes[0]
      ? {
          id: app.candidate.resumes[0].id,
          fileName: app.candidate.resumes[0].fileName,
          fileSize: app.candidate.resumes[0].fileSize,
          mimeType: app.candidate.resumes[0].mimeType,
          processingStatus: app.candidate.resumes[0].processingStatus,
        }
      : null,
  }));

  const isArchived = job.status === "ARCHIVED";

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
            Candidates in Pipeline
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <CandidatesIcon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span>
              {applicantCount} {applicantCount === 1 ? "applicant" : "applicants"}
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

      {/* Resume Upload Dropzone Card */}
      <Card id="upload-candidates">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100/70 text-blue-900">
              <UploadCloudIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Upload Candidate Resumes</CardTitle>
              <CardDescription>
                Upload resumes in PDF or DOCX format to create candidate records and associate them with this job opening.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isArchived ? (
            <div className="p-4 rounded-lg bg-slate-100 text-slate-600 text-xs">
              This job requisition is archived. You must restore the position before uploading new candidate resumes.
            </div>
          ) : (
            <ResumeDropzone jobId={job.id} />
          )}
        </CardContent>
      </Card>

      {/* Uploaded Candidates List Table */}
      <JobCandidatesList candidates={candidateItems} jobTitle={job.title} />
    </div>
  );
}
