"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createJobAction, type JobActionResult } from "@/lib/actions/job-actions";

const employmentTypeOptions = [
  { value: "", label: "Select employment type (optional)" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
  { value: "Remote", label: "Remote" },
];

export default function NewJobPage() {
  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState<JobActionResult["fieldErrors"]>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createJobAction(formData);

      if (!result.success) {
        setGlobalError(result.error || "Failed to create job. Please review the form.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      } else if (result.jobId) {
        router.push(`/jobs/${result.jobId}`);
        router.refresh();
      } else {
        router.push("/jobs");
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Create Job Requisition"
        description="Define the role requirements, experience expectations, and job description to match candidate resumes."
        breadcrumbs={[
          { label: "Jobs", href: "/jobs" },
          { label: "Create Job" },
        ]}
      />

      {globalError && (
        <Alert variant="error" className="mb-4">
          {globalError}
        </Alert>
      )}

      <Card>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Job Title */}
            <Input
              id="title"
              name="title"
              label="Job Title"
              required
              disabled={isPending}
              placeholder="e.g. Senior Backend Engineer"
              error={fieldErrors?.title}
              helperText="Clear, descriptive role title for recruitment matching"
            />

            {/* Location & Employment Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="location"
                name="location"
                label="Location"
                disabled={isPending}
                placeholder="e.g. Mumbai, India / Hybrid"
                error={fieldErrors?.location}
              />

              <Select
                id="employmentType"
                name="employmentType"
                label="Employment Type"
                disabled={isPending}
                options={employmentTypeOptions}
                error={fieldErrors?.employmentType}
              />
            </div>

            {/* Experience Requirement */}
            <div className="max-w-xs">
              <Input
                id="experienceMinYears"
                name="experienceMinYears"
                type="number"
                min="0"
                max="50"
                step="1"
                label="Minimum Experience (Years)"
                disabled={isPending}
                placeholder="e.g. 3"
                error={fieldErrors?.experienceMinYears}
                helperText="Minimum years of relevant experience required"
              />
            </div>

            {/* Job Description */}
            <Textarea
              id="description"
              name="description"
              label="Job Description"
              required
              rows={12}
              disabled={isPending}
              placeholder="Paste or write the full job description, responsibilities, technical requirements, and preferred qualifications here..."
              error={fieldErrors?.description}
              helperText="The intelligence engine will analyze these requirements in Phase 10 to extract required skills and evaluation criteria."
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link href="/jobs">
                <Button variant="outline" size="md" disabled={isPending}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isPending}
              >
                Create Job Requisition
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
