import dotenv from "dotenv";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Use test database
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env.test") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set for tests. Create backend/.env.test");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";

interface TestData {
  schoolId: number;
  parentUserId: number;
  teacherUserId: number;
  classId: number;
  studentId: number;
  attendanceId: number;
  notificationId: number;
  parentToken: string;
  teacherToken: string;
  adminToken: string;
}

// Exported so tests can use it for cleanup
export { prisma };

// Global test data populated once per test run
export let testData: TestData;

beforeAll(async () => {
  // Clean existing test data in correct order (respect FK constraints)
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  // Create school
  const school = await prisma.school.create({
    data: { name: "Test School" },
  });

  // Create users with hashed passwords
  const passwordHash = await bcrypt.hash("Test@123", 10);

  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: "admin",
      name: "Admin User",
      email: "admin@test.com",
      passwordHash,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: "teacher",
      name: "Teacher User",
      email: "teacher@test.com",
      passwordHash,
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: "parent",
      name: "Parent User",
      email: "parent@test.com",
      passwordHash,
    },
  });

  // Create class
  const classRecord = await prisma.class.create({
    data: {
      schoolId: school.id,
      name: "Grade 1",
    },
  });

  // Link teacher to class
  await prisma.classTeacher.create({
    data: {
      classId: classRecord.id,
      teacherId: teacherUser.id,
    },
  });

  // Create student
  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      classId: classRecord.id,
      name: "Test Student",
    },
  });

  // Link parent to student
  await prisma.parentStudent.create({
    data: {
      parentUserId: parentUser.id,
      studentId: student.id,
      relationship: "Mother",
      isPrimary: true,
    },
  });

  // Create attendance record (absent)
  const attendance = await prisma.attendance.create({
    data: {
      studentId: student.id,
      classId: classRecord.id,
      date: new Date("2026-07-10"),
      status: "absent",
      markedBy: teacherUser.id,
    },
  });

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      parentUserId: parentUser.id,
      studentId: student.id,
      attendanceId: attendance.id,
      type: "absence",
    },
  });

  // Create JWT tokens
  const signToken = (userId: number, role: string) =>
    jwt.sign(
      { userId: String(userId), role, schoolId: String(school.id) },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

  testData = {
    schoolId: school.id,
    parentUserId: parentUser.id,
    teacherUserId: teacherUser.id,
    classId: classRecord.id,
    studentId: student.id,
    attendanceId: attendance.id,
    notificationId: notification.id,
    parentToken: signToken(parentUser.id, "parent"),
    teacherToken: signToken(teacherUser.id, "teacher"),
    adminToken: signToken(adminUser.id, "admin"),
  };
});

afterAll(async () => {
  // Clean up test data
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  await prisma.$disconnect();
});