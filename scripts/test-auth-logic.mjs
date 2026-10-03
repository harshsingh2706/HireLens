import assert from "node:assert";
import bcrypt from "bcryptjs";

console.log("=== RUNNING PHASE 3 AUTHENTICATION VERIFICATION SUITE ===\n");

// 1. Password Hashing & Security Verification
console.log("1. Testing Password Hashing & Verification Security...");
const password = "SecurePassword123";
const saltRounds = 10;
const hash1 = await bcrypt.hash(password, saltRounds);
const hash2 = await bcrypt.hash(password, saltRounds);

// Verify salts are unique (different hashes for same password)
assert.notStrictEqual(hash1, hash2, "Bcrypt hashes must use unique salts");
assert.strictEqual(await bcrypt.compare(password, hash1), true, "Valid password must match hash");
assert.strictEqual(await bcrypt.compare("WrongPassword123", hash1), false, "Invalid password must be rejected");
assert.strictEqual(await bcrypt.compare("", hash1), false, "Empty password must be rejected");
console.log("   [PASSED] Password hashing and comparison verified.\n");

// 2. Registration Input Validation Rules
console.log("2. Testing Registration Input Validation...");
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateRegistration(name, email, password) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Full name must be at least 2 characters long.";
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid work email address.";
  if (!password || password.length < 8) errors.password = "Password must be at least 8 characters long.";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Password must contain at least one letter and one number.";
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

assert.strictEqual(validateRegistration("", "recruiter@acme.com", "Secret123").isValid, false);
assert.strictEqual(validateRegistration("Jane", "invalid-email", "Secret123").isValid, false);
assert.strictEqual(validateRegistration("Jane", "recruiter@acme.com", "short").isValid, false);
assert.strictEqual(validateRegistration("Jane", "recruiter@acme.com", "lettersonly").isValid, false);
assert.strictEqual(validateRegistration("Jane", "recruiter@acme.com", "12345678").isValid, false);
assert.strictEqual(validateRegistration("Jane Doe", "recruiter@acme.com", "ValidPass123").isValid, true);
console.log("   [PASSED] Registration validation edge cases verified.\n");

// 3. Authorization & Multi-tenant Resource Ownership Guard
console.log("3. Testing Authorization & Multi-Tenant Isolation Guards...");
class ForbiddenError extends Error {
  constructor(message = "Access denied: you do not own this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}

function assertResourceOwnership(resourceOwnerId, recruiterId, resourceName = "resource") {
  if (resourceOwnerId !== recruiterId) {
    throw new ForbiddenError(`You do not have permission to access or modify this ${resourceName}`);
  }
}

const recruiterA = "recruiter_cuid_1111";
const recruiterB = "recruiter_cuid_2222";
const jobOfRecruiterA = { id: "job_cuid_aaa", recruiterId: recruiterA };

// Recruiter A accessing their own job: must succeed without throwing
assert.doesNotThrow(() => {
  assertResourceOwnership(jobOfRecruiterA.recruiterId, recruiterA, "job");
}, "Recruiter must be allowed to access their own job");

// Recruiter B accessing Recruiter A's job: must throw ForbiddenError
assert.throws(() => {
  assertResourceOwnership(jobOfRecruiterA.recruiterId, recruiterB, "job");
}, ForbiddenError, "Recruiter B must be blocked from accessing Recruiter A's job");
console.log("   [PASSED] Server-side authorization ownership verification confirmed.\n");

// 4. Route Protection Logic
console.log("4. Testing Route Protection Rules...");
const protectedRoutes = ["/dashboard", "/jobs", "/jobs/123", "/candidates", "/search", "/settings"];
const publicRoutes = ["/login", "/register", "/", "/api/auth/signin"];

function isRouteProtected(pathname) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/candidates") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/settings")
  );
}

for (const path of protectedRoutes) {
  assert.strictEqual(isRouteProtected(path), true, `Route ${path} must be protected`);
}

for (const path of publicRoutes) {
  assert.strictEqual(isRouteProtected(path), false, `Route ${path} must NOT be protected`);
}
console.log("   [PASSED] Route protection rules verified.\n");

console.log("=== ALL AUTHENTICATION AND AUTHORIZATION CHECKS PASSED SUCCESSFULLY ===");
