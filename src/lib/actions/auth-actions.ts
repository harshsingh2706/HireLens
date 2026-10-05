"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
    company?: string;
  };
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates recruiter registration inputs and securely registers a new recruiter account.
 */
export async function registerRecruiter(formData: FormData): Promise<AuthActionResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const company = String(formData.get("company") || "").trim();

  const fieldErrors: AuthActionResult["fieldErrors"] = {};

  if (!name || name.length < 2) {
    fieldErrors.name = "Full name must be at least 2 characters long.";
  } else if (name.length > 100) {
    fieldErrors.name = "Full name must not exceed 100 characters.";
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Please enter a valid work email address.";
  }

  if (!password || password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters long.";
  } else if (password.length > 128) {
    fieldErrors.password = "Password must not exceed 128 characters.";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    fieldErrors.password = "Password must contain at least one letter and one number.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors,
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email address already exists. Please log in instead.",
        fieldErrors: {
          email: "This email is already registered.",
        },
      };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        company: company || null,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Registration error:", error);
    let errorMessage = "An unexpected error occurred while creating your account. Please try again.";

    if (error && typeof error === "object" && "message" in error) {
      const msg = String(error.message);
      if (
        msg.includes("Can't reach database server") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("PrismaClientInitializationError")
      ) {
        errorMessage =
          "Database connection error: Unable to reach PostgreSQL at localhost:5432. Please ensure your PostgreSQL database service is running.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validates credentials and signs in the recruiter via NextAuth.
 */
export async function loginRecruiter(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      success: false,
      error: "Please provide both email and password.",
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      success: false,
      error: "Invalid email or password. Please verify your credentials.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid email or password. Please verify your credentials.",
          };
        default:
          return {
            success: false,
            error: "An error occurred during authentication. Please try again.",
          };
      }
    }

    // In Next.js, NextAuth redirect throws a NEXT_REDIRECT error which shouldn't be caught as an error
    if ((error as { message?: string })?.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Login unexpected error:", error);
    return {
      success: false,
      error: "Invalid email or password. Please verify your credentials.",
    };
  }
}

/**
 * Invalidate session and signs out recruiter.
 */
export async function logoutRecruiter(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
