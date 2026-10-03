"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRecruiter, UnauthorizedError } from "@/lib/auth-guard";

export interface JobActionResult {
  success: boolean;
  jobId?: string;
  error?: string;
  fieldErrors?: {
    title?: string;
    description?: string;
    location?: string;
    employmentType?: string;
    experienceMinYears?: string;
  };
}

/**
 * Validates job input fields on the server.
 */
function validateJobInput(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const employmentType = String(formData.get("employmentType") || "").trim();
  const expRaw = String(formData.get("experienceMinYears") || "").trim();

  const fieldErrors: JobActionResult["fieldErrors"] = {};

  if (!title) {
    fieldErrors.title = "Job title is required.";
  } else if (title.length < 3) {
    fieldErrors.title = "Job title must be at least 3 characters.";
  } else if (title.length > 120) {
    fieldErrors.title = "Job title must not exceed 120 characters.";
  }

  if (!description) {
    fieldErrors.description = "Job description is required.";
  } else if (description.length < 20) {
    fieldErrors.description = "Please provide a more descriptive job description (at least 20 characters).";
  } else if (description.length > 30000) {
    fieldErrors.description = "Job description is too long (maximum 30,000 characters).";
  }

  if (location.length > 100) {
    fieldErrors.location = "Location must not exceed 100 characters.";
  }

  if (employmentType.length > 50) {
    fieldErrors.employmentType = "Employment type must not exceed 50 characters.";
  }

  let experienceMinYears: number | null = null;
  if (expRaw !== "") {
    const parsed = Number(expRaw);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0 || parsed > 50) {
      fieldErrors.experienceMinYears = "Experience requirement must be a valid number of years (0 - 50).";
    } else {
      experienceMinYears = parsed;
    }
  }

  const isValid = Object.keys(fieldErrors).length === 0;

  return {
    isValid,
    fieldErrors,
    data: {
      title,
      description,
      location: location || null,
      employmentType: employmentType || null,
      experienceMinYears,
    },
  };
}

/**
 * Server Action: Creates a new job strictly associated with the authenticated recruiter.
 */
export async function createJobAction(formData: FormData): Promise<JobActionResult> {
  try {
    const recruiter = await requireRecruiter(false);

    const { isValid, fieldErrors, data } = validateJobInput(formData);

    if (!isValid) {
      return {
        success: false,
        error: "Please correct the errors in the form.",
        fieldErrors,
      };
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: recruiter.id,
        title: data.title,
        description: data.description,
        location: data.location,
        employmentType: data.employmentType,
        experienceMinYears: data.experienceMinYears,
        status: "ACTIVE",
      },
    });

    revalidatePath("/jobs");
    revalidatePath("/dashboard");

    return {
      success: true,
      jobId: job.id,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: "Authentication required to create a job.",
      };
    }
    console.error("createJobAction error:", error);
    return {
      success: false,
      error: "Unable to create job. Please try again.",
    };
  }
}

/**
 * Server Action: Updates an existing job owned by the authenticated recruiter.
 */
export async function updateJobAction(
  jobId: string,
  formData: FormData
): Promise<JobActionResult> {
  try {
    const recruiter = await requireRecruiter(false);

    // Scoped query: verifies job exists AND belongs strictly to the authenticated recruiter
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId: recruiter.id,
      },
      select: { id: true },
    });

    if (!existingJob) {
      return {
        success: false,
        error: "Job not found or you do not have permission to modify it.",
      };
    }

    const { isValid, fieldErrors, data } = validateJobInput(formData);

    if (!isValid) {
      return {
        success: false,
        error: "Please correct the errors in the form.",
        fieldErrors,
      };
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        employmentType: data.employmentType,
        experienceMinYears: data.experienceMinYears,
      },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath(`/jobs/${jobId}/edit`);
    revalidatePath("/dashboard");

    return {
      success: true,
      jobId,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: "Authentication required to update this job.",
      };
    }
    console.error("updateJobAction error:", error);
    return {
      success: false,
      error: "Unable to update job. Please try again.",
    };
  }
}

/**
 * Server Action: Archives a job owned by the authenticated recruiter.
 */
export async function archiveJobAction(jobId: string): Promise<JobActionResult> {
  try {
    const recruiter = await requireRecruiter(false);

    // Scoped query: verifies job belongs to this recruiter
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId: recruiter.id,
      },
      select: { id: true },
    });

    if (!existingJob) {
      return {
        success: false,
        error: "Job not found or access denied.",
      };
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "ARCHIVED" },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard");

    return { success: true, jobId };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: "Authentication required to archive this job.",
      };
    }
    console.error("archiveJobAction error:", error);
    return { success: false, error: "Unable to archive job." };
  }
}

/**
 * Server Action: Unarchives an archived job owned by the authenticated recruiter.
 */
export async function unarchiveJobAction(jobId: string): Promise<JobActionResult> {
  try {
    const recruiter = await requireRecruiter(false);

    // Scoped query: verifies job belongs to this recruiter
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        recruiterId: recruiter.id,
      },
      select: { id: true },
    });

    if (!existingJob) {
      return {
        success: false,
        error: "Job not found or access denied.",
      };
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "ACTIVE" },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard");

    return { success: true, jobId };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: "Authentication required to restore this job.",
      };
    }
    console.error("unarchiveJobAction error:", error);
    return { success: false, error: "Unable to restore job." };
  }
}
