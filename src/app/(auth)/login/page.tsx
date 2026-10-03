"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginRecruiter } from "@/lib/actions/auth-actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await loginRecruiter(formData);

      if (!result.success) {
        setError(result.error || "Failed to sign in. Please verify your credentials.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          Recruiter Sign In
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your credentials to access your recruitment pipeline.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-200"
        >
          <svg
            className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="leading-relaxed font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5"
          >
            Work Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="recruiter@company.com"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-slate-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
            >
              Password
            </label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-slate-50"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed shadow-xs"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Need a recruiter account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-900 hover:text-blue-700 underline underline-offset-2 transition-colors"
          >
            Register organization
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
