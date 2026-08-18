import dotenv from "dotenv";
import path from "path";
import { beforeAll, afterAll } from "vitest";
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
  await prisma.submission.deleteMany();
  await prisma.material.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
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
  const classObj = await prisma.class.create({
    data: {
      name: "Grade 1A",
      schoolId: school.id,
      homeroomTeacherId: teacherUser.id,
    },
  });

  // Link teacher to class
  await prisma.classTeacher.create({
    data: {
      classId: classObj.id,
      teacherId: teacherUser.id,
    },
  });

  // Create student
  const student = await prisma.student.create({
    data: {
      name: "Student One",
      schoolId: school.id,
      classId: classObj.id,
    },
  });

  // Link parent to student
  await prisma.parentStudent.create({
    data: {
      parentUserId: parentUser.id,
      studentId: student.id,
      relationship: "Father",
      isPrimary: true,
    },
  });

  // Create subject & teaching assignment
  const subject = await prisma.subject.create({
    data: {
      name: "Mathematics",
      schoolId: school.id,
    },
  });

  const teachingAssignment = await prisma.teachingAssignment.create({
    data: {
      classId: classObj.id,
      teacherId: teacherUser.id,
      subjectId: subject.id,
    },
  });

  // Create attendance record for test
  const attendance = await prisma.attendance.create({
    data: {
      studentId: student.id,
      classId: classObj.id,
      date: new Date("2026-07-10T00:00:00.000Z"),
      status: "absent",
      markedBy: teacherUser.id,
    },
  });

  // Create notification record for test
  const notification = await prisma.notification.create({
    data: {
      parentUserId: parentUser.id,
      studentId: student.id,
      attendanceId: attendance.id,
      type: "absence",
    },
  });

  // Helper to sign tokens using the test secret
  const signToken = (userId: number, role: string) =>
    jwt.sign(
      { userId: String(userId), email: `${role}@test.com`, role, schoolId: String(school.id) },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

  testData = {
    schoolId: school.id,
    parentUserId: parentUser.id,
    teacherUserId: teacherUser.id,
    classId: classObj.id,
    studentId: student.id,
    subjectId: subject.id,
    attendanceId: attendance.id,
    notificationId: notification.id,
    parentToken: signToken(parentUser.id, "parent"),
    teacherToken: signToken(teacherUser.id, "teacher"),
    adminToken: signToken(adminUser.id, "admin"),
    school,
    adminUser,
    teacherUser,
    parentUser,
    class: classObj,
    student,
    subject,
    teachingAssignment,
  } as any;
});

afterAll(async () => {
  // Clean up test data
  await prisma.submission.deleteMany();
  await prisma.material.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  await prisma.$disconnect();
});