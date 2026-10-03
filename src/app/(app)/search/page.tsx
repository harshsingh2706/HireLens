import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchIcon } from "@/components/ui/icons";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Search"
        description="Search across candidates using natural language descriptions, structured skill requirements, and location filters."
      />

      {/* Search Input Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1">
            <Input
              id="candidate-search"
              placeholder="e.g. backend developers with strong Node.js experience who have built REST APIs"
              readOnly
              disabled
              helperText="Semantic candidate search will be activated in Phase 14 (PostgreSQL pgvector)."
            />
          </div>
          <div className="sm:pt-0 pt-2">
            <Button variant="primary" disabled icon={<SearchIcon className="w-4 h-4" />}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<SearchIcon className="w-8 h-8 text-slate-400" />}
            title="Semantic search ready for configuration"
            description="Once candidate resumes are uploaded and embedded via pgvector, you can query across all candidates using natural language and structured filters."
          />
        </CardContent>
      </Card>
    </div>
  );
}
