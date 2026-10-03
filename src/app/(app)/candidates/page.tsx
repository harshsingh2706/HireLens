import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CandidatesIcon, PlusIcon } from "@/components/ui/icons";

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Database"
        description="Structured candidate talent pool extracted from uploaded resumes with skill evidence."
        action={
          <Button variant="secondary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
            Upload Resumes
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<CandidatesIcon className="w-8 h-8 text-slate-400" />}
            title="No candidates in pipeline"
            description="Upload candidate resumes in PDF or DOCX format to extract structured experience, verified skills, and project history."
            action={
              <Button variant="secondary" size="sm">
                Upload Resumes (Phase 7)
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
