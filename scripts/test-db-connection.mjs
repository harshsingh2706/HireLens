import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabase() {
  console.log("=== TESTING POSTGRESQL 18.6 INTEGRATION WITH HIRELENS ===\n");

  try {
    // 1. Raw query test
    console.log("1. Executing raw query: SELECT 1 as status, version()...");
    const rawResult = await prisma.$queryRaw`SELECT 1 as status, version() as pg_version`;
    console.log("   [PASSED] PostgreSQL connection established successfully.");
    console.log(`   Database Version: ${rawResult[0].pg_version}\n`);

    // 2. Testing User model CRUD
    console.log("2. Testing User model operations...");
    const testEmail = `test-recruiter-${Date.now()}@example.com`;
    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test Recruiter",
        company: "HireLens QA Inc.",
      },
    });
    console.log(`   [PASSED] Created user with ID: ${createdUser.id}`);

    const fetchedUser = await prisma.user.findUnique({
      where: { id: createdUser.id },
    });
    if (!fetchedUser || fetchedUser.email !== testEmail) {
      throw new Error("Failed to fetch created user from PostgreSQL.");
    }
    console.log("   [PASSED] Fetched user record matches created data.");

    // 3. Testing Job model relation
    console.log("3. Testing Job model and relation...");
    const createdJob = await prisma.job.create({
      data: {
        recruiterId: createdUser.id,
        title: "Staff Systems Engineer",
        description: "PostgreSQL and distributed systems expert.",
        location: "Remote",
        employmentType: "Full-time",
      },
    });
    console.log(`   [PASSED] Created job with ID: ${createdJob.id}`);

    // 4. Testing Candidate & Resume models
    console.log("4. Testing Candidate and Resume models...");
    const createdCandidate = await prisma.candidate.create({
      data: {
        recruiterId: createdUser.id,
        name: "Jordan Lee",
        email: "jordan.lee@example.com",
        headline: "Principal Database Engineer",
        resumes: {
          create: {
            fileName: "jordan_lee_resume.pdf",
            fileSize: 45000,
            mimeType: "application/pdf",
            fileUrl: "resumes/test/jordan_lee.pdf",
            extractedText: "Jordan Lee - Principal Database Engineer. Skills: PostgreSQL, Distributed Systems.",
            processingStatus: "COMPLETED",
          },
        },
        applications: {
          create: {
            jobId: createdJob.id,
            status: "NEW",
          },
        },
      },
      include: {
        resumes: true,
        applications: true,
      },
    });
    console.log(`   [PASSED] Created candidate with ID: ${createdCandidate.id} and resume ID: ${createdCandidate.resumes[0].id}`);

    // 5. Testing Skills & CandidateSkill relation
    console.log("5. Testing Skill and CandidateSkill relation...");
    const skill = await prisma.skill.upsert({
      where: { name: "postgresql" },
      update: {},
      create: {
        name: "postgresql",
        displayName: "PostgreSQL",
        category: "Databases",
      },
    });

    const candidateSkill = await prisma.candidateSkill.create({
      data: {
        candidateId: createdCandidate.id,
        skillId: skill.id,
        yearsOfExperience: 8.0,
        contextEvidence: "Architected high-throughput PostgreSQL 18 infrastructure.",
      },
    });
    console.log(`   [PASSED] Linked candidate to skill "${skill.displayName}" (link ID: ${candidateSkill.id}).`);

    // 6. Clean up test records (cascades automatically via Prisma relation definitions)
    console.log("6. Cleaning up test records via cascade delete...");
    await prisma.user.delete({
      where: { id: createdUser.id },
    });
    console.log("   [PASSED] Test user and related records cleanly removed.");

    console.log("\n=== ALL POSTGRESQL 18.6 INTEGRATION CHECKS PASSED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
