import assert from "node:assert";
import crypto from "node:crypto";
import path from "node:path";

console.log("=== RUNNING PHASE 7 RESUME UPLOAD & STORAGE VERIFICATION SUITE ===\n");

// -------------------------------------------------------------
// 1. Test File Validation and Magic Byte Inspection
// -------------------------------------------------------------
console.log("1. Testing File Validation and Magic Byte Inspection...");

const MAX_RESUME_FILE_SIZE_MB = 10;
const MAX_RESUME_FILE_SIZE_BYTES = MAX_RESUME_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

function validateResumeBuffer(fileName, buffer) {
  const cleanFileName = path.basename(fileName).trim();

  if (!cleanFileName || buffer.length === 0) {
    return {
      isValid: false,
      error: "File is empty or filename is missing.",
      cleanFileName: cleanFileName || "unnamed",
    };
  }

  if (buffer.length > MAX_RESUME_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File exceeds maximum allowed size of ${MAX_RESUME_FILE_SIZE_MB} MB.`,
      cleanFileName,
    };
  }

  const ext = path.extname(cleanFileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file format '${ext || "unknown"}'. Only PDF and DOCX documents are accepted.`,
      cleanFileName,
    };
  }

  if (ext === ".pdf") {
    const isPdfHeader =
      buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    if (!isPdfHeader) {
      return {
        isValid: false,
        error: "Invalid or corrupted PDF file header signature.",
        cleanFileName,
      };
    }
  } else if (ext === ".docx") {
    const isDocxHeader =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (!isDocxHeader) {
      return {
        isValid: false,
        error: "Invalid or corrupted DOCX file format signature.",
        cleanFileName,
      };
    }
  }

  return {
    isValid: true,
    cleanFileName,
    extension: ext,
    mimeType: ext === ".pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}

// 1a. Valid PDF buffer (%PDF-1.4 ...)
const validPdfBuffer = Buffer.from("%PDF-1.4 sample resume content for testing");
const pdfResult = validateResumeBuffer("candidate_alex.pdf", validPdfBuffer);
assert.strictEqual(pdfResult.isValid, true);
assert.strictEqual(pdfResult.extension, ".pdf");
assert.strictEqual(pdfResult.mimeType, "application/pdf");

// 1b. Valid DOCX buffer (PK\x03\x04 ...)
const validDocxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
const docxResult = validateResumeBuffer("candidate_priya.docx", validDocxBuffer);
assert.strictEqual(docxResult.isValid, true);
assert.strictEqual(docxResult.extension, ".docx");

// 1c. Empty file
const emptyBuffer = Buffer.alloc(0);
const emptyResult = validateResumeBuffer("empty.pdf", emptyBuffer);
assert.strictEqual(emptyResult.isValid, false);
assert.strictEqual(emptyResult.error, "File is empty or filename is missing.");

// 1d. Oversized file (> 10MB)
const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
const oversizedResult = validateResumeBuffer("huge_resume.pdf", oversizedBuffer);
assert.strictEqual(oversizedResult.isValid, false);
assert.ok(oversizedResult.error.includes("exceeds maximum allowed size"));

// 1e. Disallowed extension (.exe, .zip, .png)
const exeBuffer = Buffer.from("MZ some executable payload");
const exeResult = validateResumeBuffer("malicious.exe", exeBuffer);
assert.strictEqual(exeResult.isValid, false);
assert.ok(exeResult.error.includes("Unsupported file format"));

const zipResult = validateResumeBuffer("archive.zip", validDocxBuffer);
assert.strictEqual(zipResult.isValid, false);
assert.ok(zipResult.error.includes("Unsupported file format"));

// 1f. Disguised executable renamed to .pdf (fails magic bytes)
const disguisedPdfResult = validateResumeBuffer("trojan.pdf", exeBuffer);
assert.strictEqual(disguisedPdfResult.isValid, false);
assert.strictEqual(disguisedPdfResult.error, "Invalid or corrupted PDF file header signature.");

// 1g. Plain text renamed to .docx (fails magic bytes)
const plainTextBuffer = Buffer.from("Hello, this is just plain text");
const disguisedDocxResult = validateResumeBuffer("fake.docx", plainTextBuffer);
assert.strictEqual(disguisedDocxResult.isValid, false);
assert.strictEqual(disguisedDocxResult.error, "Invalid or corrupted DOCX file format signature.");

console.log("   [PASSED] File format, bounds, and magic bytes inspections verified.\n");

// -------------------------------------------------------------
// 2. Test Secure Storage and Path Traversal Protection
// -------------------------------------------------------------
console.log("2. Testing Safe Storage & Path Traversal Guards...");

function isSafeStorageKey(storageKey) {
  const sanitized = path.basename(storageKey);
  if (sanitized !== storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    return false;
  }
  return true;
}

assert.strictEqual(isSafeStorageKey("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.pdf"), true);
assert.strictEqual(isSafeStorageKey("../../../etc/passwd"), false);
assert.strictEqual(isSafeStorageKey("..\\windows\\system32"), false);
assert.strictEqual(isSafeStorageKey("/storage/resumes/hack.pdf"), false);
assert.strictEqual(isSafeStorageKey("nested/dir/file.pdf"), false);

console.log("   [PASSED] Path traversal guards confirmed.\n");

// -------------------------------------------------------------
// 3. Test Provisional Name Generation (No fake LLM extraction)
// -------------------------------------------------------------
console.log("3. Testing Provisional Candidate Labeling...");

function deriveProvisionalName(fileName) {
  const lastDot = fileName.lastIndexOf(".");
  const nameWithoutExt = lastDot > 0 ? fileName.substring(0, lastDot) : "";
  const base = path.basename(nameWithoutExt)
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = base.toLowerCase();
  if (
    !base ||
    base.length < 2 ||
    normalized === "pdf" ||
    normalized === "docx" ||
    normalized === "resume" ||
    normalized === "cv"
  ) {
    return "Candidate (Provisional)";
  }

  return `Candidate (${base})`;
}

assert.strictEqual(deriveProvisionalName("Rahul_Sharma_Resume.pdf"), "Candidate (Rahul Sharma Resume)");
assert.strictEqual(deriveProvisionalName("John-Doe-CV-2026.docx"), "Candidate (John Doe CV 2026)");
assert.strictEqual(deriveProvisionalName(".pdf"), "Candidate (Provisional)");

console.log("   [PASSED] Transparent provisional naming verified (no fake candidate identity).\n");

// -------------------------------------------------------------
// 4. Test Multi-Tenant Isolation & Application Linking
// -------------------------------------------------------------
console.log("4. Testing Multi-Tenant Authorization & Database Linking...");

class MockDatabase {
  constructor() {
    this.jobs = new Map();
    this.candidates = new Map();
    this.resumes = new Map();
    this.applications = new Map();
  }

  async uploadResume({ recruiterId, jobId, fileName, buffer }) {
    const job = this.jobs.get(jobId);
    if (!job || job.recruiterId !== recruiterId) {
      return { success: false, error: "Job requisition not found or access denied." };
    }

    if (job.status === "ARCHIVED") {
      return { success: false, error: "Cannot upload candidates to an archived job opening." };
    }

    const validation = validateResumeBuffer(fileName, buffer);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check duplicate
    for (const app of this.applications.values()) {
      if (app.jobId === jobId) {
        const existingCand = this.candidates.get(app.candidateId);
        if (existingCand) {
          for (const res of this.resumes.values()) {
            if (res.candidateId === existingCand.id && res.fileName === validation.cleanFileName && res.fileSize === buffer.length) {
              return { success: false, error: "An identical resume file has already been uploaded for this job opening." };
            }
          }
        }
      }
    }

    // Atomic creation
    const candidateId = `cand_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const resumeId = `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const candidate = {
      id: candidateId,
      recruiterId,
      name: deriveProvisionalName(validation.cleanFileName),
      createdAt: new Date(),
    };
    this.candidates.set(candidateId, candidate);

    const resume = {
      id: resumeId,
      candidateId,
      fileName: validation.cleanFileName,
      fileSize: buffer.length,
      mimeType: validation.mimeType,
      fileUrl: `${crypto.randomUUID()}${validation.extension}`,
      processingStatus: "PENDING",
      createdAt: new Date(),
    };
    this.resumes.set(resumeId, resume);

    const application = {
      id: applicationId,
      jobId,
      candidateId,
      status: "NEW",
      createdAt: new Date(),
    };
    this.applications.set(applicationId, application);

    return {
      success: true,
      candidateId,
      resumeId,
      applicationId,
    };
  }

  async getResumeForRecruiter({ resumeId, recruiterId }) {
    const resume = this.resumes.get(resumeId);
    if (!resume) return null;
    const candidate = this.candidates.get(resume.candidateId);
    if (!candidate || candidate.recruiterId !== recruiterId) return null;
    return resume;
  }
}

const mockDb = new MockDatabase();
const recruiterA = "recruiter_A";
const recruiterB = "recruiter_B";

// Recruiter A creates a job
mockDb.jobs.set("job_1", {
  id: "job_1",
  recruiterId: recruiterA,
  title: "Full-Stack Engineer",
  status: "ACTIVE",
});

// Recruiter B attempts to upload to Recruiter A's job -> BLOCKED
const uploadAttemptByB = await mockDb.uploadResume({
  recruiterId: recruiterB,
  jobId: "job_1",
  fileName: "candidate_alex.pdf",
  buffer: validPdfBuffer,
});
assert.strictEqual(uploadAttemptByB.success, false);
assert.strictEqual(uploadAttemptByB.error, "Job requisition not found or access denied.");

// Recruiter A uploads valid resume to Job 1 -> SUCCEEDS
const uploadA = await mockDb.uploadResume({
  recruiterId: recruiterA,
  jobId: "job_1",
  fileName: "candidate_alex.pdf",
  buffer: validPdfBuffer,
});
assert.strictEqual(uploadA.success, true);
assert.ok(uploadA.candidateId);
assert.ok(uploadA.resumeId);

// Verify records created
const createdCand = mockDb.candidates.get(uploadA.candidateId);
assert.strictEqual(createdCand.recruiterId, recruiterA);
assert.strictEqual(createdCand.name, "Candidate (candidate alex)");

const createdResume = mockDb.resumes.get(uploadA.resumeId);
assert.strictEqual(createdResume.processingStatus, "PENDING");
assert.strictEqual(createdResume.fileName, "candidate_alex.pdf");

const createdApp = mockDb.applications.get(uploadA.applicationId);
assert.strictEqual(createdApp.status, "NEW");
assert.strictEqual(createdApp.jobId, "job_1");

// Recruiter B attempts to download Recruiter A's resume -> BLOCKED
const resumeAccessByB = await mockDb.getResumeForRecruiter({
  resumeId: uploadA.resumeId,
  recruiterId: recruiterB,
});
assert.strictEqual(resumeAccessByB, null, "Recruiter B must NOT be able to view Recruiter A's resume");

// Recruiter A accesses their own resume -> SUCCEEDS
const resumeAccessByA = await mockDb.getResumeForRecruiter({
  resumeId: uploadA.resumeId,
  recruiterId: recruiterA,
});
assert.ok(resumeAccessByA);
assert.strictEqual(resumeAccessByA.id, uploadA.resumeId);

// Uploading identical duplicate resume to same job -> REJECTED
const duplicateUpload = await mockDb.uploadResume({
  recruiterId: recruiterA,
  jobId: "job_1",
  fileName: "candidate_alex.pdf",
  buffer: validPdfBuffer,
});
assert.strictEqual(duplicateUpload.success, false);
assert.ok(duplicateUpload.error.includes("identical resume file has already been uploaded"));

console.log("   [PASSED] Multi-tenant upload isolation & secure access verified.\n");

console.log("=== ALL PHASE 7 RESUME UPLOAD & STORAGE TESTS PASSED ===");
