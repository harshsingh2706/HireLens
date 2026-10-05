import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecruiter } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MailIcon,
  PhoneIcon,
  LocationIcon,
  ExternalLinkIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  AwardIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { CandidateStructuringButton } from "@/components/candidates/candidate-structuring-button";
import { type StructuredResumeData } from "@/lib/ai/types";

interface CandidateProfilePageProps {
  params: Promise<{ candidateId: string }>;
}

export default async function CandidateProfilePage({ params }: CandidateProfilePageProps) {
  const recruiter = await requireRecruiter();
  const { candidateId } = await params;

  // Query candidate strictly scoped to the authenticated recruiter
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      recruiterId: recruiter.id,
    },
    include: {
      resumes: {
        orderBy: { createdAt: "desc" },
      },
      skills: {
        include: {
          skill: true,
        },
        orderBy: [
          { yearsOfExperience: "desc" },
          { createdAt: "asc" },
        ],
      },
      applications: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  const primaryResume = candidate.resumes[0];
  const structuredData = candidate.structuredData as StructuredResumeData | null;
  const isStructured = Boolean(structuredData && structuredData.skills);
  const primaryApplication = candidate.applications[0];

  // Group candidate skills by category
  const skillsByCategory = candidate.skills.reduce<Record<string, typeof candidate.skills>>((acc, curr) => {
    const category = curr.skill.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(curr);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={candidate.name}
        description={candidate.headline || "Candidate Profile"}
        breadcrumbs={[
          { label: "Candidates", href: "/candidates" },
          { label: candidate.name },
        ]}
        action={
          <CandidateStructuringButton
            candidateId={candidate.id}
            hasExtractedText={Boolean(primaryResume?.extractedText)}
            isStructured={isStructured}
            model={structuredData?._meta?.model}
            lastStructuredAt={structuredData?._meta?.structuredAt}
          />
        }
      />

      {/* Contact & Profile Highlights Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
                {candidate.experienceYears !== null && candidate.experienceYears !== undefined && (
                  <Badge variant="primary" size="sm">
                    {candidate.experienceYears} {candidate.experienceYears === 1 ? "year" : "years"} exp
                  </Badge>
                )}
                {isStructured && (
                  <Badge variant="success" size="sm" className="gap-1">
                    <SparklesIcon className="w-3 h-3 text-emerald-600" />
                    Verified Entities
                  </Badge>
                )}
              </div>
              {candidate.headline && (
                <p className="text-sm font-medium text-slate-600">{candidate.headline}</p>
              )}
            </div>

            {primaryApplication?.job && (
              <div className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-3 shrink-0">
                <span className="text-slate-400 block font-medium">Applied Position</span>
                <Link
                  href={`/jobs/${primaryApplication.job.id}`}
                  className="font-semibold text-blue-900 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <BriefcaseIcon className="w-3.5 h-3.5" />
                  {primaryApplication.job.title}
                </Link>
              </div>
            )}
          </div>

          {/* Contact Details Grid */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
            {candidate.email ? (
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${candidate.email}`} className="text-blue-900 hover:underline truncate">
                  {candidate.email}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <MailIcon className="w-4 h-4 shrink-0" />
                <span>No email provided</span>
              </div>
            )}

            {candidate.phone ? (
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`tel:${candidate.phone}`} className="text-slate-700 hover:underline">
                  {candidate.phone}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <PhoneIcon className="w-4 h-4 shrink-0" />
                <span>No phone provided</span>
              </div>
            )}

            {structuredData?.contact?.location ? (
              <div className="flex items-center gap-2">
                <LocationIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{structuredData.contact.location}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <LocationIcon className="w-4 h-4 shrink-0" />
                <span>Location unspecified</span>
              </div>
            )}

            {/* External Links */}
            <div className="flex items-center gap-3">
              {structuredData?.contact?.linkedinUrl && (
                <a
                  href={structuredData.contact.linkedinUrl.startsWith("http") ? structuredData.contact.linkedinUrl : `https://${structuredData.contact.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 hover:underline font-medium flex items-center gap-1"
                >
                  LinkedIn <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
              {structuredData?.contact?.githubUrl && (
                <a
                  href={structuredData.contact.githubUrl.startsWith("http") ? structuredData.contact.githubUrl : `https://${structuredData.contact.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 hover:underline font-medium flex items-center gap-1"
                >
                  GitHub <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
              {structuredData?.contact?.portfolioUrl && (
                <a
                  href={structuredData.contact.portfolioUrl.startsWith("http") ? structuredData.contact.portfolioUrl : `https://${structuredData.contact.portfolioUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 hover:underline font-medium flex items-center gap-1"
                >
                  Portfolio <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      {candidate.summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Professional Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
              {candidate.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Evidence-Backed Skills Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extracted Skills &amp; Context Evidence</CardTitle>
              <CardDescription>
                Skills extracted directly from the resume with verified contextual evidence quotes.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {candidate.skills.length} skills indexed
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {candidate.skills.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
              No structured skills extracted yet. Click &quot;Structure with AI&quot; above to parse skills from this resume.
            </div>
          ) : (
            Object.entries(skillsByCategory).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  {category}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {items.map((candSkill) => (
                    <div
                      key={candSkill.id}
                      className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900">
                          {candSkill.skill.displayName}
                        </span>
                        {candSkill.yearsOfExperience !== null && (
                          <Badge variant="neutral" size="sm">
                            {candSkill.yearsOfExperience} {candSkill.yearsOfExperience === 1 ? "yr" : "yrs"}
                          </Badge>
                        )}
                      </div>
                      {candSkill.contextEvidence && (
                        <p className="mt-1 text-[11px] text-slate-600 italic leading-snug line-clamp-2" title={candSkill.contextEvidence}>
                          &ldquo;{candSkill.contextEvidence}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Work Experience Timeline */}
      {structuredData?.workExperience && structuredData.workExperience.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Work Experience</CardTitle>
            <CardDescription>
              Chronological employment history extracted from the candidate&apos;s resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-6">
            {structuredData.workExperience.map((exp, idx) => (
              <div
                key={idx}
                className="relative pl-6 pb-6 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
              >
                {/* Timeline node */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-900 border-2 border-white shadow-sm" />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        {exp.startDate || "Date unspecified"} — {exp.endDate || (exp.isCurrent ? "Present" : "Date unspecified")}
                      </span>
                      {exp.isCurrent && (
                        <Badge variant="success" size="sm">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                    <span>{exp.company}</span>
                    {exp.location && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-500">{exp.location}</span>
                      </>
                    )}
                  </div>

                  {exp.description && (
                    <p className="text-xs text-slate-700 leading-relaxed mt-2 font-normal">
                      {exp.description}
                    </p>
                  )}

                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                      {exp.highlights.map((item, hIdx) => (
                        <li key={hIdx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Technologies:
                      </span>
                      {exp.skillsUsed.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education & Certifications Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-4 h-4 text-blue-900" />
              <CardTitle>Education</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {!structuredData?.education || structuredData.education.length === 0 ? (
              <span className="text-xs text-slate-400 block">No education records structured.</span>
            ) : (
              structuredData.education.map((edu, idx) => (
                <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
                  <div className="font-semibold text-xs text-slate-900">{edu.degree}</div>
                  <div className="text-xs text-slate-600">{edu.institution}</div>
                  {edu.fieldOfStudy && (
                    <div className="text-[11px] text-slate-500">Major: {edu.fieldOfStudy}</div>
                  )}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{edu.startDate || ""} {edu.endDate ? `— ${edu.endDate}` : ""}</span>
                    {edu.gradeOrGpa && <span>GPA/Grade: {edu.gradeOrGpa}</span>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AwardIcon className="w-4 h-4 text-blue-900" />
              <CardTitle>Certifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {!structuredData?.certifications || structuredData.certifications.length === 0 ? (
              <span className="text-xs text-slate-400 block">No certifications found in resume.</span>
            ) : (
              structuredData.certifications.map((cert, idx) => (
                <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
                  <div className="font-semibold text-xs text-slate-900">{cert.name}</div>
                  {cert.issuer && <div className="text-xs text-slate-600">{cert.issuer}</div>}
                  {cert.issueDate && (
                    <div className="text-[10px] text-slate-400">Issued: {cert.issueDate}</div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stored Resume Document & Extracted Text Card */}
      {primaryResume && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4 text-blue-900" />
                <CardTitle>Original Resume &amp; Extracted Text</CardTitle>
              </div>
              <a
                href={`/api/resumes/${primaryResume.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" icon={<ExternalLinkIcon className="w-3.5 h-3.5" />}>
                  Download Document
                </Button>
              </a>
            </div>
            <CardDescription>
              {primaryResume.fileName} &bull; {(primaryResume.fileSize / 1024).toFixed(1)} KB &bull; Uploaded {formatDate(primaryResume.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {primaryResume.extractedText ? (
              <details className="text-xs">
                <summary className="font-semibold text-blue-900 cursor-pointer hover:underline">
                  View raw normalized extracted text ({primaryResume.extractedText.length} characters)
                </summary>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                  <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {primaryResume.extractedText}
                  </pre>
                </div>
              </details>
            ) : (
              <span className="text-xs text-slate-400">
                Text has not been extracted from this resume yet.
              </span>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
