import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            HL
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">HireLens</h1>
            <p className="text-xs text-slate-500 font-medium">AI Recruitment Intelligence Platform</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          A dedicated, recruiter-side intelligence platform for deep resume analysis, deterministic
          qualification verification, and explainable candidate matching.
        </p>

        <div className="border-t border-slate-100 pt-6">
          {session?.user ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Logged in as <strong className="text-slate-900">{session.user.email}</strong>
              </span>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
              >
                Go to Dashboard &rarr;
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-1/2 text-center py-2.5 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 transition-colors shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-1/2 text-center py-2.5 px-4 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Register Recruiter
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
