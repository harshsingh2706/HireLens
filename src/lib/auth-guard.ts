import { auth } from "@/auth";
import { redirect } from "next/navigation";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied: you do not own this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface AuthenticatedRecruiter {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

/**
 * Returns the currently authenticated recruiter session, or null if unauthenticated.
 * Always derived server-side from signed session tokens, NEVER trusted from client inputs.
 */
export async function getCurrentRecruiter(): Promise<AuthenticatedRecruiter | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Recruiter",
    email: session.user.email,
    company: session.user.company ?? null,
  };
}

/**
 * Enforces authentication server-side.
 * If redirectIfUnauthenticated is true, redirects to /login.
 * Otherwise, throws an UnauthorizedError.
 */
export async function requireRecruiter(redirectIfUnauthenticated = true): Promise<AuthenticatedRecruiter> {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    if (redirectIfUnauthenticated) {
      redirect("/login");
    }
    throw new UnauthorizedError("Authentication required to access this resource");
  }

  return recruiter;
}

/**
 * Verifies that a resource belongs strictly to the authenticated recruiter.
 * Prevents multi-tenant data leaks and unauthorized cross-recruiter access.
 */
export function assertResourceOwnership(
  resourceOwnerId: string,
  recruiterId: string,
  resourceName = "resource"
): void {
  if (resourceOwnerId !== recruiterId) {
    throw new ForbiddenError(`You do not have permission to access or modify this ${resourceName}`);
  }
}
