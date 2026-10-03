import React from "react";
import { requireRecruiter } from "@/lib/auth-guard";
import { AppShell } from "@/components/layout/app-shell";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces server-side authentication check. Redirects to /login if unauthenticated.
  const recruiter = await requireRecruiter();

  return <AppShell recruiter={recruiter}>{children}</AppShell>;
}
