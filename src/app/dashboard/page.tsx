import React from "react";
import { requireRecruiter } from "@/lib/auth-guard";
import { logoutRecruiter } from "@/lib/actions/auth-actions";

export default async function DashboardPage() {
  // Enforces server-side authentication check. Redirects to /login if unauthenticated.
  const recruiter = await requireRecruiter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
              HL
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">HireLens</span>
            <span className="text-xs text-slate-400 font-medium">/</span>
            <span className="text-xs font-medium text-slate-600">Auth Verification Shell</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">{recruiter.name}</p>
              <p className="text-[11px] text-slate-500">{recruiter.email}</p>
            </div>
            <form action={logoutRecruiter}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300/80 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Authentication Session Verified
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Phase 3 authentication flow successfully verified.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Authenticated: {recruiter.id.slice(0, 10)}...
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Server Session Identity
              </span>
              <p className="text-slate-800 font-mono text-[13px]">{recruiter.email}</p>
              <p className="text-slate-600 mt-1">ID: {recruiter.id}</p>
              {recruiter.company && (
                <p className="text-slate-600">Organization: {recruiter.company}</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Authorization Isolation
              </span>
              <p className="text-slate-700 leading-relaxed">
                Recruiter ownership is enforced on all mutations. Data queries are strictly scoped
                to <span className="font-mono text-slate-900">recruiterId: &quot;{recruiter.id}&quot;</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
