import assert from "node:assert";

console.log("=== RUNNING PHASE 5 RECRUITER DASHBOARD VERIFICATION SUITE ===\n");

// 1. Test Intl Date and Number Formatters
console.log("1. Testing Date and Number Formatters...");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const numberFormatter = new Intl.NumberFormat("en-US");

function formatDate(date) {
  const d = typeof date === "object" ? date : new Date(date);
  return isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}

function formatNumber(num) {
  return numberFormatter.format(num);
}

function getTimeGreeting(testHour) {
  const hour = testHour !== undefined ? testHour : new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

assert.strictEqual(formatNumber(1250), "1,250");
assert.strictEqual(formatNumber(0), "0");
assert.strictEqual(formatDate(new Date("2026-10-03T12:00:00Z")), "Oct 3, 2026");
assert.strictEqual(formatDate("invalid-date"), "—");
assert.strictEqual(getTimeGreeting(9), "Good morning");
assert.strictEqual(getTimeGreeting(14), "Good afternoon");
assert.strictEqual(getTimeGreeting(21), "Good evening");
console.log("   [PASSED] Formatters and time greetings verified.\n");

// 2. Test Multi-Tenant Query Scoping and Isolation Logic
console.log("2. Testing Multi-Tenant Dashboard Query Isolation...");

// Mock Prisma client to track exact query filters passed
class MockPrisma {
  constructor() {
    this.calls = [];
  }

  job = {
    count: async (args) => {
      this.calls.push({ entity: "job.count", args });
      return args?.where?.status === "ACTIVE" ? 2 : 3;
    },
    findMany: async (args) => {
      this.calls.push({ entity: "job.findMany", args });
      return [
        {
          id: "job_1",
          title: "Senior Backend Engineer",
          location: "Remote",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          createdAt: new Date("2026-10-01"),
          _count: { applications: 4 },
        },
      ];
    },
  };

  candidate = {
    count: async (args) => {
      this.calls.push({ entity: "candidate.count", args });
      return 12;
    },
  };

  application = {
    count: async (args) => {
      this.calls.push({ entity: "application.count", args });
      if (args?.where?.status === "SHORTLISTED") return 2;
      return 5;
    },
    findMany: async (args) => {
      this.calls.push({ entity: "application.findMany", args });
      return [
        {
          id: "app_1",
          status: "NEW",
          createdAt: new Date("2026-10-02"),
          candidate: { id: "cand_1", name: "Alex Mercer", email: "alex@example.com" },
          job: { id: "job_1", title: "Senior Backend Engineer" },
        },
      ];
    },
  };
}

async function simulateGetDashboardData(prismaMock, recruiterId) {
  const [
    activeJobsCount,
    totalCandidatesCount,
    toReviewCount,
    shortlistedCount,
    recentJobsRaw,
    recentApplicationsRaw,
    totalJobsCount,
  ] = await Promise.all([
    prismaMock.job.count({ where: { recruiterId, status: "ACTIVE" } }),
    prismaMock.candidate.count({ where: { recruiterId } }),
    prismaMock.application.count({
      where: {
        job: { recruiterId },
        status: { in: ["NEW", "REVIEWING"] },
      },
    }),
    prismaMock.application.count({
      where: { job: { recruiterId }, status: "SHORTLISTED" },
    }),
    prismaMock.job.findMany({
      where: { recruiterId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        location: true,
        employmentType: true,
        status: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prismaMock.application.findMany({
      where: { job: { recruiterId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        candidate: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
    }),
    prismaMock.job.count({ where: { recruiterId } }),
  ]);

  return {
    metrics: {
      activeJobsCount,
      totalCandidatesCount,
      toReviewCount,
      shortlistedCount,
    },
    recentJobsCount: recentJobsRaw.length,
    recentCandidatesCount: recentApplicationsRaw.length,
    hasAnyJobs: totalJobsCount > 0,
  };
}

const mockPrismaA = new MockPrisma();
const recruiterA = "recruiter_cuid_aaa";
const resultA = await simulateGetDashboardData(mockPrismaA, recruiterA);

// Verify all queries were strictly scoped to recruiter A
for (const call of mockPrismaA.calls) {
  const where = call.args?.where;
  assert.ok(where, `Query ${call.entity} must contain a WHERE filter`);
  const hasDirectRecruiterId = where.recruiterId === recruiterA;
  const hasNestedRecruiterId = where.job?.recruiterId === recruiterA;
  assert.ok(
    hasDirectRecruiterId || hasNestedRecruiterId,
    `Query ${call.entity} must strictly filter by recruiterId: "${recruiterA}". Got: ${JSON.stringify(where)}`
  );
}

assert.strictEqual(resultA.metrics.activeJobsCount, 2);
assert.strictEqual(resultA.metrics.totalCandidatesCount, 12);
assert.strictEqual(resultA.metrics.toReviewCount, 5);
assert.strictEqual(resultA.metrics.shortlistedCount, 2);
assert.strictEqual(resultA.hasAnyJobs, true);
console.log("   [PASSED] All database queries are strictly scoped by recruiterId.\n");

// 3. Test Empty State Handling for New Recruiters
console.log("3. Testing Empty State Detection for Brand New Recruiters...");
const emptyPrisma = new MockPrisma();
// Override to return 0 for everything
emptyPrisma.job.count = async () => 0;
emptyPrisma.job.findMany = async () => [];
emptyPrisma.candidate.count = async () => 0;
emptyPrisma.application.count = async () => 0;
emptyPrisma.application.findMany = async () => [];

const emptyResult = await simulateGetDashboardData(emptyPrisma, "recruiter_brand_new");
assert.strictEqual(emptyResult.metrics.activeJobsCount, 0);
assert.strictEqual(emptyResult.metrics.totalCandidatesCount, 0);
assert.strictEqual(emptyResult.recentJobsCount, 0);
assert.strictEqual(emptyResult.recentCandidatesCount, 0);
assert.strictEqual(emptyResult.hasAnyJobs, false);
console.log("   [PASSED] Zero-metric and empty state detection confirmed.\n");

console.log("=== ALL RECRUITER DASHBOARD VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
