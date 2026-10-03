import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobsIcon, PlusIcon } from "@/components/ui/icons";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings"
        description="Manage job descriptions, required competencies, and candidate matching pipelines."
        action={
          <Button variant="primary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
            Create Job
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<JobsIcon className="w-8 h-8 text-slate-400" />}
            title="No job openings created yet"
            description="Create your first job posting to start extracting structured requirements and matching candidate resumes."
            action={
              <Button variant="primary" size="sm" icon={<PlusIcon className="w-3.5 h-3.5" />}>
                Create Job Requisition
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
