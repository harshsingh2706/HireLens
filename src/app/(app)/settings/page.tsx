import React from "react";
import { requireRecruiter } from "@/lib/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const recruiter = await requireRecruiter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Organization"
        description="Manage your recruiter profile, organization information, and security preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recruiter Profile</CardTitle>
              <Badge variant="success">Active Session</Badge>
            </div>
            <CardDescription>Your personal account details on HireLens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-1">Full Name</span>
              <p className="text-sm font-semibold text-slate-800">{recruiter.name}</p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-slate-400 font-medium block mb-1">Work Email</span>
              <p className="text-sm font-mono text-slate-800">{recruiter.email}</p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-slate-400 font-medium block mb-1">Recruiter ID</span>
              <p className="text-xs font-mono text-slate-500">{recruiter.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization & Security</CardTitle>
            <CardDescription>Multi-tenant workspace isolation & tenant identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-1">Organization Name</span>
              <p className="text-sm font-semibold text-slate-800">
                {recruiter.company || "Independent Recruiter"}
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-slate-400 font-medium block mb-1">Tenant Isolation</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                All candidates, resumes, and job listings are strictly scoped to your recruiter ID.
                Cross-recruiter access is denied by server-side authorization guards.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
