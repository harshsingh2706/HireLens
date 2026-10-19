import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testRegistrationFlow() {
  console.log("=== VERIFYING RECRUITER REGISTRATION & LOGIN IN POSTGRESQL ===\n");

  const email = `recruiter-${Date.now()}@hirelens-test.com`;
  const password = "SecurePassword123";
  const name = "Jane Recruiter";
  const company = "Apex Search Partners";

  try {
    // 1. Simulate registration action logic
    console.log(`1. Registering recruiter: ${email}...`);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        company,
      },
    });

    console.log(`   [PASSED] User record successfully inserted into PostgreSQL. ID: ${user.id}`);

    // 2. Simulate authentication check (NextAuth authorize logic)
    console.log("2. Simulating NextAuth credentials authorize check...");
    const queriedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!queriedUser || !queriedUser.passwordHash) {
      throw new Error("User lookup failed in PostgreSQL.");
    }

    const passwordValid = await bcrypt.compare(password, queriedUser.passwordHash);
    if (!passwordValid) {
      throw new Error("Password verification failed.");
    }

    console.log(`   [PASSED] Password verified against bcrypt hash. User authenticated as: ${queriedUser.name}`);

    // 3. Clean up test user
    console.log("3. Cleaning up test user...");
    await prisma.user.delete({ where: { id: user.id } });
    console.log("   [PASSED] Test user cleaned up.");

    console.log("\n=== REGISTRATION & AUTHENTICATION TO POSTGRESQL 18.6 VERIFIED ===");
  } catch (error) {
    console.error("Test error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistrationFlow();
