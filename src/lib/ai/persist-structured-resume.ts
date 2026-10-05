import { prisma } from "@/lib/prisma";
import { type Prisma } from "@prisma/client";
import { type StructuredResumeData } from "./types";

/**
 * Persists validated structured resume data into PostgreSQL, updating the Candidate record
 * and upserting extracted skills into the relational skill graph with context evidence.
 */
export async function persistStructuredResume(
  candidateId: string,
  recruiterId: string,
  data: StructuredResumeData
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Authorize: verify candidate belongs strictly to the authenticated recruiter
    const existingCandidate = await tx.candidate.findFirst({
      where: {
        id: candidateId,
        recruiterId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        headline: true,
        summary: true,
        experienceYears: true,
      },
    });

    if (!existingCandidate) {
      throw new Error("Candidate record not found or access denied.");
    }

    // 2. Decide whether to update candidate's name:
    // If the current name is provisional (e.g., starts with "Candidate (") or blank,
    // or if a valid candidate name was extracted, use the extracted name.
    const isProvisional = existingCandidate.name.startsWith("Candidate (") || existingCandidate.name === "Candidate";
    const newName = (data.candidateName && data.candidateName.trim().length > 0)
      ? data.candidateName.trim()
      : (isProvisional ? "Candidate" : existingCandidate.name);

    // 3. Update candidate record with structured entities
    const updatedCandidate = await tx.candidate.update({
      where: { id: candidateId },
      data: {
        name: newName,
        email: data.contact.email || existingCandidate.email,
        phone: data.contact.phone || existingCandidate.phone,
        headline: data.headline || existingCandidate.headline,
        summary: data.summary || existingCandidate.summary,
        experienceYears: data.totalExperienceYears !== null ? data.totalExperienceYears : existingCandidate.experienceYears,
        structuredData: data as unknown as Prisma.InputJsonValue,
      },
    });

    // 4. Upsert skills into the relational Skill and CandidateSkill tables
    if (data.skills && Array.isArray(data.skills)) {
      for (const skillItem of data.skills) {
        if (!skillItem.name || skillItem.name.trim().length === 0) continue;

        const canonicalName = skillItem.name.trim().toLowerCase();
        const displayName = skillItem.name.trim();

        // Upsert canonical skill
        const skill = await tx.skill.upsert({
          where: { name: canonicalName },
          update: {
            displayName,
            category: skillItem.category || "Other",
          },
          create: {
            name: canonicalName,
            displayName,
            category: skillItem.category || "Other",
          },
        });

        // Link skill to candidate with evidence and experience years
        await tx.candidateSkill.upsert({
          where: {
            candidateId_skillId: {
              candidateId: candidateId,
              skillId: skill.id,
            },
          },
          update: {
            yearsOfExperience: skillItem.yearsOfExperience,
            contextEvidence: skillItem.contextEvidence || null,
          },
          create: {
            candidateId: candidateId,
            skillId: skill.id,
            yearsOfExperience: skillItem.yearsOfExperience,
            contextEvidence: skillItem.contextEvidence || null,
          },
        });
      }
    }

    return updatedCandidate;
  });
}
