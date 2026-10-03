import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobsIcon, CandidatesIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Recruiter Overview"
        description="Pipeline intelligence, active positions, and candidate matches across your organization."
        action={
          <Link href="/jobs">
            <Button variant="primary" size="md" icon={<PlusIcon className="w-4 h-4" />}>
              Create Job
            </Button>
          </Link>
        }
      />

      {/* Metrics Row (Transparent, Zero Fake Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Jobs
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">0</span>
            <span className="text-xs text-slate-400 font-medium">positions open</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">No active job descriptions posted yet</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Candidates
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">0</span>
            <span className="text-xs text-slate-400 font-medium">in database</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Awaiting initial resume uploads</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Processed Resumes
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">0</span>
            <span className="text-xs text-slate-400 font-medium">parsed & structured</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">0 pending extraction queue</p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Shortlisted
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">0</span>
            <span className="text-xs text-slate-400 font-medium">candidates</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Matches will appear upon evaluation</p>
        </Card>
      </div>

      {/* Main Grid: Active Jobs & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Job Openings</CardTitle>
              <CardDescription>Recently created requisitions and requirement profiles</CardDescription>
            </div>
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<JobsIcon className="w-6 h-6 text-slate-400" />}
              title="No jobs created yet"
              description="Post your first job description to start structuring role requirements and matching candidate resumes."
              action={
                <Link href="/jobs">
                  <Button variant="secondary" size="sm" icon={<PlusIcon className="w-3.5 h-3.5" />}>
                    Post New Job
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>

        {/* Recent Candidate Activity Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Candidate Activity</CardTitle>
              <CardDescription>Recent resume processing and match evaluations</CardDescription>
            </div>
            <Link href="/candidates">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<CandidatesIcon className="w-6 h-6 text-slate-400" />}
              title="No candidates processed yet"
              description="Uploaded resumes and extracted candidate profiles will appear here once processed by the intelligence engine."
              action={
                <Link href="/candidates">
                  <Button variant="secondary" size="sm">
                    Manage Candidates
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Product Flow Guide Card */}
      <Card className="bg-gradient-to-r from-blue-900/5 via-slate-50 to-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                Workflow Guide
              </span>
              <h4 className="text-sm font-semibold text-slate-900 mt-1">
                How HireLens Intelligence Works
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                1. Create a job requisition &rarr; 2. Upload candidate resumes (PDF/DOCX) &rarr; 3. Run
                deterministic skill matching &amp; semantic similarity search &rarr; 4. Review explainable
                evidence and decide.
              </p>
            </div>
            <Link href="/search" className="shrink-0">
              <Button variant="outline" size="sm" icon={<SearchIcon className="w-3.5 h-3.5" />}>
                Try Candidate Search
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
