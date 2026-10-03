"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerRecruiter, loginRecruiter, type AuthActionResult } from "@/lib/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState<AuthActionResult["fieldErrors"]>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await registerRecruiter(formData);

      if (!result.success) {
        setGlobalError(result.error || "Failed to register. Please check the fields below.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      } else {
        // Automatically sign in upon successful registration
        const loginResult = await loginRecruiter(formData);
        if (loginResult.success) {
          router.push("/dashboard");
          router.refresh();
        } else {
          router.push("/login?registered=true");
        }
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Create Recruiter Account
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Set up your organization to start reviewing and matching candidates.
        </p>
      </div>

      {globalError && (
        <Alert variant="error" className="mb-5">
          {globalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="name"
          name="name"
          type="text"
          label="Full Name"
          autoComplete="name"
          required
          disabled={isPending}
          placeholder="Jane Doe"
          error={fieldErrors?.name}
        />

        <Input
          id="company"
          name="company"
          type="text"
          label="Company / Organization"
          autoComplete="organization"
          disabled={isPending}
          placeholder="Acme Corp"
          helperText="Optional: Your recruitment agency or corporate department"
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Work Email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="recruiter@company.com"
          error={fieldErrors?.email}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          disabled={isPending}
          placeholder="At least 8 characters (letters & numbers)"
          error={fieldErrors?.password}
          helperText="Must contain at least 8 characters, with letters and numbers."
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isPending}
            className="w-full"
          >
            Create Recruiter Account
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-900 hover:text-blue-700 underline underline-offset-2 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
