/**
 * TypeScript type definitions for Phase 9 AI Resume Structuring
 */

export interface ExtractedSkill {
  name: string;
  category: "Languages" | "Frameworks & Libraries" | "Databases" | "Cloud & DevOps" | "Tools & Platforms" | "Other";
  yearsOfExperience: number | null;
  contextEvidence: string;
}

export interface ExtractedWorkExperience {
  company: string;
  role: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  highlights: string[];
  skillsUsed: string[];
}

export interface ExtractedEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  gradeOrGpa: string | null;
}

export interface ExtractedCertification {
  name: string;
  issuer: string | null;
  issueDate: string | null;
}

export interface ExtractedContact {
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
}

export interface StructuredResumeData {
  candidateName: string;
  headline: string | null;
  summary: string | null;
  totalExperienceYears: number | null;
  contact: ExtractedContact;
  workExperience: ExtractedWorkExperience[];
  education: ExtractedEducation[];
  skills: ExtractedSkill[];
  certifications: ExtractedCertification[];
  _meta?: {
    model: string;
    structuredAt: string;
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface StructuringExecutionResult {
  success: boolean;
  data?: StructuredResumeData;
  error?: string;
  isConfigured: boolean;
}
