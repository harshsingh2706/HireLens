import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon } from "@/components/ui/icons";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-16 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 shadow-xs">
        {/* Brand & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              HL
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                HireLens
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Recruitment Intelligence Platform
              </span>
            </div>
          </div>
          <Badge variant="primary">B2B Recruiter Portal</Badge>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4 leading-snug">
          Explainable, evidence-based AI candidate intelligence.
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          HireLens bridges raw resume documents and complex job requirements with structured
          extraction, deterministic skill gap analysis, and semantic similarity search — delivering
          explainable hiring decisions without black-box scores.
        </p>

        {/* Feature Checkpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Deterministic skill gap verification</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Structured JD & resume extraction</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Vector semantic candidate search</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multi-tenant recruiter data isolation</span>
          </div>
        </div>

        {/* CTA Area */}
        <div className="border-t border-slate-100 pt-6">
          {session?.user ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Logged in as <strong className="text-slate-800">{session.user.email}</strong>
              </span>
              <Link href="/dashboard">
                <Button variant="primary" size="md">
                  Go to Recruiter Dashboard &rarr;
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/login" className="w-full sm:w-1/2">
                <Button variant="primary" size="md" className="w-full">
                  Recruiter Sign In
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-1/2">
                <Button variant="secondary" size="md" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        HireLens SaaS &bull; Recruiter Decision Support System
      </footer>
    </main>
  );
}
