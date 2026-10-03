import React from "react";
import { notFound } from "next/navigation";
import { requireRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EditJobForm } from "@/components/jobs/edit-job-form";

interface EditJobPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const recruiter = await requireRecruiter();
  const { jobId } = await params;

  // Retrieve job strictly scoped to the authenticated recruiter
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      recruiterId: recruiter.id,
    },
    select: {
      id: true,
      recruiterId: true,
      title: true,
      description: true,
      location: true,
      employmentType: true,
      experienceMinYears: true,
    },
  });

  // Strict multi-tenant verification:
  // If the job does not exist or does not belong to the current authenticated recruiter, return 404
  if (!job) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Edit ${job.title}`}
        description="Update role details, location, experience requirements, or criteria."
        breadcrumbs={[
          { label: "Jobs", href: "/jobs" },
          { label: job.title, href: `/jobs/${job.id}` },
          { label: "Edit" },
        ]}
      />

      <EditJobForm
        job={{
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType,
          experienceMinYears: job.experienceMinYears,
        }}
      />
    </div>
  );
}
