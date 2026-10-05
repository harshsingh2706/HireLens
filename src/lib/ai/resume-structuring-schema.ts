/**
 * JSON Schema for OpenAI Structured Outputs (strict mode compliant)
 */

export const RESUME_STRUCTURING_JSON_SCHEMA = {
  name: "structured_resume",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "candidateName",
      "headline",
      "summary",
      "totalExperienceYears",
      "contact",
      "workExperience",
      "education",
      "skills",
      "certifications",
    ],
    properties: {
      candidateName: {
        type: "string",
        description: "The full legal or professional name of the candidate found in the resume.",
      },
      headline: {
        type: ["string", "null"],
        description: "Professional headline or current job title (e.g. 'Senior Full-Stack Engineer').",
      },
      summary: {
        type: ["string", "null"],
        description: "A concise professional summary extracted or summarized strictly from the resume.",
      },
      totalExperienceYears: {
        type: ["number", "null"],
        description: "Estimated total years of professional work experience derived from employment dates or explicitly stated in resume.",
      },
      contact: {
        type: "object",
        additionalProperties: false,
        required: [
          "email",
          "phone",
          "location",
          "linkedinUrl",
          "githubUrl",
          "portfolioUrl",
        ],
        properties: {
          email: {
            type: ["string", "null"],
            description: "Candidate email address if present.",
          },
          phone: {
            type: ["string", "null"],
            description: "Candidate phone number if present.",
          },
          location: {
            type: ["string", "null"],
            description: "City, state, or country of residence if present.",
          },
          linkedinUrl: {
            type: ["string", "null"],
            description: "LinkedIn profile URL or handle if present.",
          },
          githubUrl: {
            type: ["string", "null"],
            description: "GitHub profile URL or handle if present.",
          },
          portfolioUrl: {
            type: ["string", "null"],
            description: "Personal website or portfolio link if present.",
          },
        },
      },
      workExperience: {
        type: "array",
        description: "List of employment positions held by the candidate, ordered chronologically (newest first).",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "company",
            "role",
            "location",
            "startDate",
            "endDate",
            "isCurrent",
            "description",
            "highlights",
            "skillsUsed",
          ],
          properties: {
            company: {
              type: "string",
              description: "Company or employer name.",
            },
            role: {
              type: "string",
              description: "Job title or position.",
            },
            location: {
              type: ["string", "null"],
              description: "Location of the job or 'Remote'.",
            },
            startDate: {
              type: ["string", "null"],
              description: "Start date (e.g., 'Jan 2021', '2021', or null).",
            },
            endDate: {
              type: ["string", "null"],
              description: "End date (e.g., 'Present', 'Dec 2023', or null).",
            },
            isCurrent: {
              type: "boolean",
              description: "True if this is the candidate's active/current position.",
            },
            description: {
              type: "string",
              description: "Concise summary of the candidate's responsibilities.",
            },
            highlights: {
              type: "array",
              description: "Key bullet points, accomplishments, and quantifiable achievements in this role.",
              items: { type: "string" },
            },
            skillsUsed: {
              type: "array",
              description: "Technologies, languages, and tools explicitly mentioned in connection with this position.",
              items: { type: "string" },
            },
          },
        },
      },
      education: {
        type: "array",
        description: "Academic history and degrees.",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "institution",
            "degree",
            "fieldOfStudy",
            "startDate",
            "endDate",
            "gradeOrGpa",
          ],
          properties: {
            institution: {
              type: "string",
              description: "University, college, or educational institution name.",
            },
            degree: {
              type: "string",
              description: "Degree or qualification obtained (e.g., 'B.S.', 'M.S.', 'High School Diploma').",
            },
            fieldOfStudy: {
              type: ["string", "null"],
              description: "Major or specialization (e.g., 'Computer Science').",
            },
            startDate: {
              type: ["string", "null"],
              description: "Start year/date if provided.",
            },
            endDate: {
              type: ["string", "null"],
              description: "Graduation or end year/date if provided.",
            },
            gradeOrGpa: {
              type: ["string", "null"],
              description: "GPA, honors, or grade classification if stated in resume.",
            },
          },
        },
      },
      skills: {
        type: "array",
        description: "Technical and professional skills explicitly demonstrated or listed in the resume.",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "name",
            "category",
            "yearsOfExperience",
            "contextEvidence",
          ],
          properties: {
            name: {
              type: "string",
              description: "Canonical name of the skill (e.g. 'TypeScript', 'PostgreSQL', 'Docker', 'React').",
            },
            category: {
              type: "string",
              enum: [
                "Languages",
                "Frameworks & Libraries",
                "Databases",
                "Cloud & DevOps",
                "Tools & Platforms",
                "Other",
              ],
              description: "Standardized category for this skill.",
            },
            yearsOfExperience: {
              type: ["number", "null"],
              description: "Estimated years this candidate has used this skill based on work history dates, or null if ambiguous.",
            },
            contextEvidence: {
              type: "string",
              description: "A brief factual excerpt, phrase, or sentence from the resume demonstrating how/where the skill was applied.",
            },
          },
        },
      },
      certifications: {
        type: "array",
        description: "Professional licenses and certifications.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "issuer", "issueDate"],
          properties: {
            name: {
              type: "string",
              description: "Certification title (e.g., 'AWS Certified Solutions Architect').",
            },
            issuer: {
              type: ["string", "null"],
              description: "Issuing organization (e.g., 'Amazon Web Services').",
            },
            issueDate: {
              type: ["string", "null"],
              description: "Year or date issued if stated.",
            },
          },
        },
      },
    },
  },
};
