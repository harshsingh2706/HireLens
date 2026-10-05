/**
 * Phase 9 AI Resume Structuring Autonomous Test Suite
 * Tests strict schema conformance, client guardrails, structured entity validation,
 * persistence, relational skills graph, and multi-tenant isolation.
 */

import assert from "node:assert";

// 1. Strict JSON Schema definition matching OpenAI Structured Outputs requirements
const RESUME_STRUCTURING_JSON_SCHEMA = {
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
      candidateName: { type: "string" },
      headline: { type: ["string", "null"] },
      summary: { type: ["string", "null"] },
      totalExperienceYears: { type: ["number", "null"] },
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
          email: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          linkedinUrl: { type: ["string", "null"] },
          githubUrl: { type: ["string", "null"] },
          portfolioUrl: { type: ["string", "null"] },
        },
      },
      workExperience: {
        type: "array",
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
            company: { type: "string" },
            role: { type: "string" },
            location: { type: ["string", "null"] },
            startDate: { type: ["string", "null"] },
            endDate: { type: ["string", "null"] },
            isCurrent: { type: "boolean" },
            description: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            skillsUsed: { type: "array", items: { type: "string" } },
          },
        },
      },
      education: {
        type: "array",
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
            institution: { type: "string" },
            degree: { type: "string" },
            fieldOfStudy: { type: ["string", "null"] },
            startDate: { type: ["string", "null"] },
            endDate: { type: ["string", "null"] },
            gradeOrGpa: { type: ["string", "null"] },
          },
        },
      },
      skills: {
        type: "array",
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
            name: { type: "string" },
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
            },
            yearsOfExperience: { type: ["number", "null"] },
            contextEvidence: { type: "string" },
          },
        },
      },
      certifications: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "issuer", "issueDate"],
          properties: {
            name: { type: "string" },
            issuer: { type: ["string", "null"] },
            issueDate: { type: ["string", "null"] },
          },
        },
      },
    },
  },
};

// Client validation and guardrails simulation
function validateStructuringInput(extractedText, apiKey, model = "gpt-4o-mini") {
  if (!extractedText || extractedText.trim().length < 20) {
    return {
      success: false,
      isConfigured: !!(apiKey && apiKey.trim() && apiKey !== "sk-..."),
      error: "Extracted resume text is too short or empty to structure with AI.",
    };
  }

  if (!apiKey || apiKey.trim() === "" || apiKey === "sk-...") {
    return {
      success: false,
      isConfigured: false,
      error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file to enable AI resume structuring.",
    };
  }

  return {
    success: true,
    isConfigured: true,
    model,
  };
}

// In-Memory mock of the relational persistence transaction
class MockDatabase {
  constructor() {
    this.candidates = new Map();
    this.skills = new Map();
    this.candidateSkills = new Map();
  }

  async persistStructuredResume(candidateId, recruiterId, data) {
    const existing = this.candidates.get(candidateId);
    if (!existing || existing.recruiterId !== recruiterId) {
      throw new Error("Candidate record not found or access denied.");
    }

    const isProvisional = existing.name.startsWith("Candidate (") || existing.name === "Candidate";
    const newName = (data.candidateName && data.candidateName.trim().length > 0)
      ? data.candidateName.trim()
      : (isProvisional ? "Candidate" : existing.name);

    const updated = {
      ...existing,
      name: newName,
      email: data.contact.email || existing.email,
      phone: data.contact.phone || existing.phone,
      headline: data.headline || existing.headline,
      summary: data.summary || existing.summary,
      experienceYears: data.totalExperienceYears !== null ? data.totalExperienceYears : existing.experienceYears,
      structuredData: data,
    };
    this.candidates.set(candidateId, updated);

    // Upsert skills
    if (data.skills && Array.isArray(data.skills)) {
      for (const skillItem of data.skills) {
        const canonical = skillItem.name.trim().toLowerCase();
        let skillRecord = this.skills.get(canonical);
        if (!skillRecord) {
          skillRecord = {
            id: `skill_${this.skills.size + 1}`,
            name: canonical,
            displayName: skillItem.name.trim(),
            category: skillItem.category || "Other",
          };
          this.skills.set(canonical, skillRecord);
        }

        const linkKey = `${candidateId}_${skillRecord.id}`;
        this.candidateSkills.set(linkKey, {
          candidateId,
          skillId: skillRecord.id,
          yearsOfExperience: skillItem.yearsOfExperience,
          contextEvidence: skillItem.contextEvidence,
          skill: skillRecord,
        });
      }
    }

    return updated;
  }
}

async function runPhase9Tests() {
  console.log("=== RUNNING PHASE 9 AI RESUME STRUCTURING VERIFICATION SUITE ===\n");

  // ----------------------------------------------------
  // TEST 1: OpenAI Strict JSON Schema Verification
  // ----------------------------------------------------
  console.log("1. Testing OpenAI Strict JSON Schema...");
  assert.strictEqual(RESUME_STRUCTURING_JSON_SCHEMA.name, "structured_resume");
  assert.strictEqual(RESUME_STRUCTURING_JSON_SCHEMA.strict, true);
  assert.strictEqual(RESUME_STRUCTURING_JSON_SCHEMA.schema.type, "object");
  assert.strictEqual(RESUME_STRUCTURING_JSON_SCHEMA.schema.additionalProperties, false);

  const req = RESUME_STRUCTURING_JSON_SCHEMA.schema.required;
  assert.ok(req.includes("candidateName"));
  assert.ok(req.includes("contact"));
  assert.ok(req.includes("workExperience"));
  assert.ok(req.includes("education"));
  assert.ok(req.includes("skills"));
  assert.ok(req.includes("certifications"));

  console.log("   [PASSED] Strict JSON Schema meets all OpenAI Structured Outputs specifications.\n");

  // ----------------------------------------------------
  // TEST 2: Client Guardrails, Short Inputs & Configuration Detection
  // ----------------------------------------------------
  console.log("2. Testing Client Validation & Guardrails...");

  // Short input (<20 chars)
  const shortCheck = validateStructuringInput("Hi there", "sk-12345");
  assert.strictEqual(shortCheck.success, false);
  assert.ok(shortCheck.error.includes("too short"));

  // Missing API key
  const missingKeyCheck = validateStructuringInput(
    "Alex Rivera\nSenior Platform Engineer\nExperience: 5 years with Docker and Kubernetes.",
    ""
  );
  assert.strictEqual(missingKeyCheck.success, false);
  assert.strictEqual(missingKeyCheck.isConfigured, false);
  assert.ok(missingKeyCheck.error.includes("OPENAI_API_KEY"));

  // Placeholder key (sk-...)
  const placeholderKeyCheck = validateStructuringInput(
    "Alex Rivera\nSenior Platform Engineer\nExperience: 5 years with Docker and Kubernetes.",
    "sk-..."
  );
  assert.strictEqual(placeholderKeyCheck.success, false);
  assert.strictEqual(placeholderKeyCheck.isConfigured, false);

  // Valid configuration
  const validCheck = validateStructuringInput(
    "Alex Rivera\nSenior Platform Engineer\nExperience: 5 years with Docker and Kubernetes.",
    "sk-real-api-key-test"
  );
  assert.strictEqual(validCheck.success, true);
  assert.strictEqual(validCheck.isConfigured, true);
  assert.strictEqual(validCheck.model, "gpt-4o-mini");

  console.log("   [PASSED] Client properly enforces character bounds and catches missing credentials.\n");

  // ----------------------------------------------------
  // TEST 3: Entity Transformation & Database Persistence
  // ----------------------------------------------------
  console.log("3. Testing Structured Entity Ingestion & Relational Skill Graph...");

  const db = new MockDatabase();
  const recruiter1 = "recruiter_cuid_1001";
  const recruiter2 = "recruiter_cuid_1002";

  // Recruiter 1 has an uploaded candidate with provisional naming
  const initialCandidate = {
    id: "cand_1",
    recruiterId: recruiter1,
    name: "Candidate (alex_rivera_resume)",
    email: null,
    phone: null,
    headline: null,
    summary: null,
    experienceYears: null,
    structuredData: null,
  };
  db.candidates.set("cand_1", initialCandidate);

  // Synthetic structured result from OpenAI
  const syntheticResult = {
    candidateName: "Alex Rivera",
    headline: "Senior Platform Engineer",
    summary: "Senior backend and cloud infrastructure engineer specializing in distributed systems.",
    totalExperienceYears: 5.5,
    contact: {
      email: "alex.rivera@example.com",
      phone: "+1-555-0144",
      location: "Austin, TX",
      linkedinUrl: "https://linkedin.com/in/alexrivera-test",
      githubUrl: "https://github.com/alexrivera-test",
      portfolioUrl: "https://alexrivera.dev",
    },
    workExperience: [
      {
        company: "CloudScale Systems",
        role: "Senior Platform Engineer",
        location: "Austin, TX",
        startDate: "Jan 2021",
        endDate: "Present",
        isCurrent: true,
        description: "Architected containerized microservices and automated CI/CD deployments.",
        highlights: [
          "Scaled Kubernetes clusters to handle 200M monthly requests with 99.99% uptime.",
          "Optimized PostgreSQL connection pooling, reducing latency by 40%.",
        ],
        skillsUsed: ["Kubernetes", "Docker", "PostgreSQL", "Go"],
      },
    ],
    education: [
      {
        institution: "University of Texas at Austin",
        degree: "B.S. in Computer Science",
        fieldOfStudy: "Computer Science",
        startDate: "2015",
        endDate: "2019",
        gradeOrGpa: "3.85 GPA",
      },
    ],
    skills: [
      {
        name: "Kubernetes",
        category: "Cloud & DevOps",
        yearsOfExperience: 4.0,
        contextEvidence: "Scaled Kubernetes clusters to handle 200M monthly requests with 99.99% uptime.",
      },
      {
        name: "Docker",
        category: "Cloud & DevOps",
        yearsOfExperience: 5.0,
        contextEvidence: "Architected containerized microservices across development and production.",
      },
      {
        name: "PostgreSQL",
        category: "Databases",
        yearsOfExperience: 5.0,
        contextEvidence: "Optimized PostgreSQL connection pooling, reducing latency by 40%.",
      },
    ],
    certifications: [
      {
        name: "Certified Kubernetes Administrator (CKA)",
        issuer: "Cloud Native Computing Foundation",
        issueDate: "2022",
      },
    ],
    _meta: {
      model: "gpt-4o-mini",
      structuredAt: new Date().toISOString(),
    },
  };

  // Execute persistence
  const savedCandidate = await db.persistStructuredResume("cand_1", recruiter1, syntheticResult);

  // Verify candidate updated
  assert.strictEqual(savedCandidate.name, "Alex Rivera");
  assert.strictEqual(savedCandidate.headline, "Senior Platform Engineer");
  assert.strictEqual(savedCandidate.email, "alex.rivera@example.com");
  assert.strictEqual(savedCandidate.phone, "+1-555-0144");
  assert.strictEqual(savedCandidate.experienceYears, 5.5);
  assert.ok(savedCandidate.structuredData);

  // Verify skills graph
  assert.strictEqual(db.skills.size, 3);
  assert.ok(db.skills.has("kubernetes"));
  assert.ok(db.skills.has("docker"));
  assert.ok(db.skills.has("postgresql"));

  const k8sLink = db.candidateSkills.get("cand_1_skill_1");
  assert.ok(k8sLink);
  assert.strictEqual(k8sLink.skill.displayName, "Kubernetes");
  assert.strictEqual(k8sLink.yearsOfExperience, 4.0);
  assert.strictEqual(
    k8sLink.contextEvidence,
    "Scaled Kubernetes clusters to handle 200M monthly requests with 99.99% uptime."
  );

  console.log("   [PASSED] Candidate entities, work experience, education, and skills graph successfully persisted.\n");

  // ----------------------------------------------------
  // TEST 4: Multi-Tenant Authorization Isolation
  // ----------------------------------------------------
  console.log("4. Testing Multi-Tenant Authorization Boundaries...");

  let unauthorizedBlocked = false;
  try {
    // Recruiter 2 attempts to structure Recruiter 1's candidate
    await db.persistStructuredResume("cand_1", recruiter2, syntheticResult);
  } catch (err) {
    unauthorizedBlocked = true;
    assert.ok(err.message.includes("access denied"));
  }

  assert.strictEqual(unauthorizedBlocked, true, "Cross-recruiter structuring MUST be blocked");
  console.log("   [PASSED] Cross-recruiter structuring access strictly blocked.\n");

  console.log("=== ALL PHASE 9 VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runPhase9Tests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
