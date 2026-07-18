import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface UpsertParentStudentPayload {
  schoolId: string;
  parentUserId: string;
  studentId: string;
  relationship?: string | null;
  isPrimary?: boolean;
}

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

export async function upsertParentStudentLink(payload: UpsertParentStudentPayload) {
  const schoolId = parseId(payload.schoolId, "schoolId");
  const parentUserId = parseId(payload.parentUserId, "parentUserId");
  const studentId = parseId(payload.studentId, "studentId");

  const [parent, student] = await Promise.all([
    prisma.user.findFirst({
      where: { id: parentUserId, schoolId, role: "parent" },
      select: { id: true },
    }),
    prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    }),
  ]);

  if (!parent) {
    throw appErrors.notFound("Parent not found");
  }

  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  return prisma.parentStudent.upsert({
    where: {
      parentUserId_studentId: {
        parentUserId,
        studentId,
      },
    },
    create: {
      parentUserId,
      studentId,
      relationship: payload.relationship?.trim() || null,
      isPrimary: payload.isPrimary ?? false,
    },
    update: {
      relationship: payload.relationship?.trim() || null,
      isPrimary: payload.isPrimary ?? false,
    },
  });
}

export async function deleteParentStudentLink(
  schoolIdValue: string,
  parentUserIdValue: string,
  studentIdValue: string,
) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const parentUserId = parseId(parentUserIdValue, "parentUserId");
  const studentId = parseId(studentIdValue, "studentId");

  const parent = await prisma.user.findFirst({
    where: { id: parentUserId, schoolId, role: "parent" },
    select: { id: true },
  });

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true },
  });

  if (!parent || !student) {
    throw appErrors.notFound("Parent-student link not found");
  }

  await prisma.parentStudent.delete({
    where: {
      parentUserId_studentId: {
        parentUserId,
        studentId,
      },
    },
  });

  return { deleted: true };
}

export async function listParentStudentLinks(schoolIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");

  return prisma.parentStudent.findMany({
    where: {
      parent: { schoolId },
      student: { schoolId },
    },
    select: {
      parent: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          classId: true,
          createdAt: true,
        },
      },
      relationship: true,
      isPrimary: true,
    },
  });
}

interface ListParentChildrenPayload {
  parentUserId: string;
  schoolId: string;
}

export async function listParentChildren(payload: ListParentChildrenPayload) {
  const parentUserId = parseId(payload.parentUserId, "parentUserId");
  const schoolId = parseId(payload.schoolId, "schoolId");

  const links = await prisma.parentStudent.findMany({
    where: {
      parentUserId,
      parent: { schoolId },
      student: { schoolId },
    },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      relationship: true,
      isPrimary: true,
    },
    orderBy: {
      student: {
        name: "asc",
      },
    },
  });

  return links.map((link) => ({
    id: link.student.id,
    name: link.student.name,
    class: link.student.class,
    relationship: link.relationship,
    isPrimary: link.isPrimary,
  }));
}
