import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-utils";

/**
 * Seed the database with initial data.
 * Creates a test school and an admin user.
 */
async function main() {
  console.log("Seeding database...");

  // Check if test school already exists
  let school = await prisma.school.findFirst({
    where: { name: "Test School" },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "Test School",
      },
    });
    console.log(`Created school: ${school.name} (ID: ${school.id})`);
  } else {
    console.log(`School already exists: ${school.name} (ID: ${school.id})`);
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
