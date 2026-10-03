import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-blue-100 selection:text-blue-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-slate-900 group transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
            HL
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            HireLens
          </span>
        </Link>
        <p className="mt-1 text-xs font-medium text-slate-500 tracking-wide uppercase">
          AI Recruitment Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
          {children}
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} HireLens Inc. Strictly for authorized recruitment personnel.
      </footer>
    </div>
  );
}
