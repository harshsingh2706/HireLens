"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { updateJobAction, type JobActionResult } from "@/lib/actions/job-actions";

const employmentTypeOptions = [
  { value: "", label: "Select employment type (optional)" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
  { value: "Remote", label: "Remote" },
];

export interface InitialJobData {
  id: string;
  title: string;
  description: string;
  location: string | null;
  employmentType: string | null;
  experienceMinYears: number | null;
}

export function EditJobForm({ job }: { job: InitialJobData }) {
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
      const result = await updateJobAction(job.id, formData);

      if (!result.success) {
        setGlobalError(result.error || "Failed to update job requisition. Please check the form.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      } else {
        router.push(`/jobs/${job.id}`);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        {globalError && (
          <Alert variant="error" className="mb-6">
            {globalError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Job Title */}
          <Input
            id="title"
            name="title"
            label="Job Title"
            required
            defaultValue={job.title}
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
              defaultValue={job.location || ""}
              disabled={isPending}
              placeholder="e.g. Mumbai, India / Hybrid"
              error={fieldErrors?.location}
            />

            <Select
              id="employmentType"
              name="employmentType"
              label="Employment Type"
              defaultValue={job.employmentType || ""}
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
              defaultValue={job.experienceMinYears !== null ? String(job.experienceMinYears) : ""}
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
            defaultValue={job.description}
            disabled={isPending}
            placeholder="Paste or write the full job description, responsibilities, technical requirements, and preferred qualifications here..."
            error={fieldErrors?.description}
            helperText="Requirements and criteria used to cross-reference candidate qualifications."
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href={`/jobs/${job.id}`}>
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
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
