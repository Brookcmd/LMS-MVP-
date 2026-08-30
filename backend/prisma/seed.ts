import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-utils";

/**
 * Seed the database with initial data.
 * Creates a test school and an admin user.
 */
async function main() {
  console.log("Seeding database...");

  // Target fixed School ID 254
  const TARGET_SCHOOL_ID = 254;
  let school = await prisma.school.findUnique({
    where: { id: TARGET_SCHOOL_ID },
  });

  if (!school) {
    school = await prisma.school.upsert({
      where: { id: TARGET_SCHOOL_ID },
      update: { name: "Sheba Academy" },
      create: {
        id: TARGET_SCHOOL_ID,
        name: "Sheba Academy",
      },
    });
    console.log(`Configured fixed school: ${school.name} (ID: ${school.id})`);
  } else {
    console.log(`Using fixed school: ${school.name} (ID: ${school.id})`);
  }

  // Check if admin user already exists
  let adminUser = await prisma.user.findUnique({
    where: {
      email_schoolId: {
        email: "admin@testschool.com",
        schoolId: school.id,
      },
    },
  });

  if (!adminUser) {
    const passwordHash = await hashPassword("Admin@123");
    adminUser = await prisma.user.create({
      data: {
        schoolId: school.id,
        name: "Admin User",
        email: "admin@testschool.com",
        role: "admin",
        passwordHash,
        phone: null,
      },
    });
    console.log(
      `Created admin user: ${adminUser.email} (ID: ${adminUser.id})`,
    );
    console.log("Default password: Admin@123");
  } else {
    console.log(`Admin user already exists: ${adminUser.email}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
