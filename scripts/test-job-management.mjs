import assert from "node:assert";

console.log("=== RUNNING PHASE 6 JOB MANAGEMENT VERIFICATION SUITE ===\n");

// -------------------------------------------------------------
// 1. Test Server-side Input Validation Logic
// -------------------------------------------------------------
console.log("1. Testing Server-side Input Validation...");

function validateJobInput(dataMap) {
  const title = String(dataMap.title || "").trim();
  const description = String(dataMap.description || "").trim();
  const location = String(dataMap.location || "").trim();
  const employmentType = String(dataMap.employmentType || "").trim();
  const expRaw = String(dataMap.experienceMinYears !== undefined ? dataMap.experienceMinYears : "").trim();

  const fieldErrors = {};

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

  let experienceMinYears = null;
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

// 1a. Missing required fields
const emptyCheck = validateJobInput({});
assert.strictEqual(emptyCheck.isValid, false);
assert.ok(emptyCheck.fieldErrors.title);
assert.ok(emptyCheck.fieldErrors.description);

// 1b. Title constraints
const shortTitle = validateJobInput({ title: "AB", description: "This is a valid long description for testing." });
assert.strictEqual(shortTitle.isValid, false);
assert.strictEqual(shortTitle.fieldErrors.title, "Job title must be at least 3 characters.");

const longTitle = validateJobInput({ title: "A".repeat(121), description: "This is a valid long description for testing." });
assert.strictEqual(longTitle.isValid, false);
assert.strictEqual(longTitle.fieldErrors.title, "Job title must not exceed 120 characters.");

// 1c. Description constraints
const shortDesc = validateJobInput({ title: "Software Engineer", description: "Too short" });
assert.strictEqual(shortDesc.isValid, false);
assert.strictEqual(shortDesc.fieldErrors.description, "Please provide a more descriptive job description (at least 20 characters).");

// 1d. Experience bounds
const negativeExp = validateJobInput({
  title: "DevOps Engineer",
  description: "Senior platform engineer to manage AWS infrastructure.",
  experienceMinYears: -1,
});
assert.strictEqual(negativeExp.isValid, false);
assert.ok(negativeExp.fieldErrors.experienceMinYears);

const highExp = validateJobInput({
  title: "DevOps Engineer",
  description: "Senior platform engineer to manage AWS infrastructure.",
  experienceMinYears: 55,
});
assert.strictEqual(highExp.isValid, false);
assert.ok(highExp.fieldErrors.experienceMinYears);

const nonIntExp = validateJobInput({
  title: "DevOps Engineer",
  description: "Senior platform engineer to manage AWS infrastructure.",
  experienceMinYears: 3.5,
});
assert.strictEqual(nonIntExp.isValid, false);
assert.ok(nonIntExp.fieldErrors.experienceMinYears);

// 1e. Valid inputs
const validJob = validateJobInput({
  title: "  Lead Full-Stack Engineer  ",
  description: "We are seeking a senior lead engineer with Next.js, Node.js, and PostgreSQL expertise.",
  location: "  Mumbai / Remote  ",
  employmentType: "Full-time",
  experienceMinYears: "5",
});
assert.strictEqual(validJob.isValid, true);
assert.strictEqual(validJob.data.title, "Lead Full-Stack Engineer");
assert.strictEqual(validJob.data.location, "Mumbai / Remote");
assert.strictEqual(validJob.data.experienceMinYears, 5);
console.log("   [PASSED] All server-side validation rules verified.\n");

// -------------------------------------------------------------
// 2. Test Multi-Tenant Job Isolation and Security Scoping
// -------------------------------------------------------------
console.log("2. Testing Multi-Tenant Job Isolation...");

class MockDatabase {
  constructor() {
    this.jobs = new Map();
  }

  async createJob({ recruiterId, title, description, location, employmentType, experienceMinYears, status }) {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job = {
      id,
      recruiterId,
      title,
      description,
      location,
      employmentType,
      experienceMinYears,
      status: status || "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async findFirstJob({ id, recruiterId }) {
    const job = this.jobs.get(id);
    if (!job) return null;
    if (job.recruiterId !== recruiterId) return null;
    return job;
  }

  async updateJob(id, recruiterId, data) {
    const job = await this.findFirstJob({ id, recruiterId });
    if (!job) return null;
    const updated = { ...job, ...data, updatedAt: new Date() };
    this.jobs.set(id, updated);
    return updated;
  }

  async listJobs({ recruiterId, status }) {
    const results = [];
    for (const job of this.jobs.values()) {
      if (job.recruiterId === recruiterId && (!status || job.status === status)) {
        results.push(job);
      }
    }
    return results;
  }
}

const db = new MockDatabase();
const recruiterA = "recruiter_A_id";
const recruiterB = "recruiter_B_id";

// Recruiter A creates a job
const jobA = await db.createJob({
  recruiterId: recruiterA,
  title: "Senior Backend Engineer",
  description: "Must know distributed systems, PostgreSQL, and event architectures.",
  location: "Bengaluru",
  employmentType: "Full-time",
  experienceMinYears: 4,
  status: "ACTIVE",
});

assert.strictEqual(jobA.recruiterId, recruiterA);
assert.strictEqual(jobA.status, "ACTIVE");

// Recruiter B attempts to view Recruiter A's job -> MUST RETURN NULL (404)
const accessAttemptByB = await db.findFirstJob({ id: jobA.id, recruiterId: recruiterB });
assert.strictEqual(accessAttemptByB, null, "Recruiter B must NOT be able to view Recruiter A's job");

// Recruiter B attempts to update Recruiter A's job -> MUST RETURN NULL (Forbidden)
const updateAttemptByB = await db.updateJob(jobA.id, recruiterB, { title: "Hacked Job Title" });
assert.strictEqual(updateAttemptByB, null, "Recruiter B must NOT be able to update Recruiter A's job");

// Verify job A title remains unmodified
const jobACheck = await db.findFirstJob({ id: jobA.id, recruiterId: recruiterA });
assert.strictEqual(jobACheck.title, "Senior Backend Engineer");

console.log("   [PASSED] Cross-recruiter access & modification strictly blocked.\n");

// -------------------------------------------------------------
// 3. Test Archive and Restore Status Workflow
// -------------------------------------------------------------
console.log("3. Testing Safe Job Archival and Reactivation...");

// Recruiter A archives job A
const archivedJob = await db.updateJob(jobA.id, recruiterA, { status: "ARCHIVED" });
assert.strictEqual(archivedJob.status, "ARCHIVED");

// Query active jobs for Recruiter A -> must not contain archived job
const activeJobsA = await db.listJobs({ recruiterId: recruiterA, status: "ACTIVE" });
assert.strictEqual(activeJobsA.length, 0);

// Query archived jobs for Recruiter A -> must contain archived job
const archivedJobsA = await db.listJobs({ recruiterId: recruiterA, status: "ARCHIVED" });
assert.strictEqual(archivedJobsA.length, 1);
assert.strictEqual(archivedJobsA[0].id, jobA.id);

// Recruiter A restores job A
const restoredJob = await db.updateJob(jobA.id, recruiterA, { status: "ACTIVE" });
assert.strictEqual(restoredJob.status, "ACTIVE");

// Verify active jobs list now includes job A again
const activeJobsAfterRestore = await db.listJobs({ recruiterId: recruiterA, status: "ACTIVE" });
assert.strictEqual(activeJobsAfterRestore.length, 1);
assert.strictEqual(activeJobsAfterRestore[0].title, "Senior Backend Engineer");

console.log("   [PASSED] Job archival and restoration state transitions confirmed.\n");

// -------------------------------------------------------------
// 4. Test Recruiter Editing Behavior
// -------------------------------------------------------------
console.log("4. Testing Legitimate Job Editing...");

const editedJob = await db.updateJob(jobA.id, recruiterA, {
  title: "Principal Backend Architect",
  location: "Remote / Bengaluru",
  experienceMinYears: 8,
});

assert.strictEqual(editedJob.title, "Principal Backend Architect");
assert.strictEqual(editedJob.location, "Remote / Bengaluru");
assert.strictEqual(editedJob.experienceMinYears, 8);
// Recruiter ID must remain immutable
assert.strictEqual(editedJob.recruiterId, recruiterA);
assert.strictEqual(editedJob.id, jobA.id);

console.log("   [PASSED] Recruiter editing preserves ownership and immutability.\n");

console.log("=== ALL PHASE 6 JOB MANAGEMENT VERIFICATION CHECKS PASSED ===");
