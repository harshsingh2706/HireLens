import { NextRequest, NextResponse } from "next/server";
import { getCurrentRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getResumeFileBuffer } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ resumeId: string }>;
}

/**
 * Secure resume document streaming endpoint.
 * Strictly verifies authenticated recruiter ownership through Candidate -> Recruiter association.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return new NextResponse("Authentication required", { status: 401 });
  }

  const { resumeId } = await params;

  // Strict ownership check at query level:
  // Resume must belong to a Candidate created by this authenticated recruiter
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      candidate: {
        recruiterId: recruiter.id,
      },
    },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      fileUrl: true,
    },
  });

  if (!resume) {
    return new NextResponse("Resume not found or access denied", { status: 404 });
  }

  const fileBuffer = await getResumeFileBuffer(resume.fileUrl);
  if (!fileBuffer) {
    return new NextResponse("Resume file content unavailable", { status: 404 });
  }

  const safeFilename = resume.fileName.replace(/["\r\n]/g, "_");

  // Return binary response with appropriate MIME type and inline disposition
  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": resume.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
