import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface CreateStudentPayload {
  schoolId: string;
  name: string;
  classId: string;
  dob?: string | null;
}

export interface UpdateStudentPayload {
  schoolId: string;
  studentId: string;
  name?: string;
  classId?: string;
  dob?: string | null;
}

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw appErrors.badRequest("Invalid dob");
  }

  return parsed;
}

export async function createStudent(payload: CreateStudentPayload) {
  const schoolId = parseId(payload.schoolId, "schoolId");
  const classId = parseId(payload.classId, "classId");
  const name = payload.name?.trim();
  const dob = parseOptionalDate(payload.dob);

  if (!name) {
    throw appErrors.badRequest("Missing required field: name");
  }

  const classRecord = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });

  if (!classRecord) {
    throw appErrors.notFound("Class not found");
  }

  return prisma.student.create({
    data: {
      schoolId,
      classId,
      name,
      dob,
    },
  });
}

export async function listStudents(schoolIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");

  return prisma.student.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      parents: {
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

export async function getStudentById(schoolIdValue: string, studentIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const studentId = parseId(studentIdValue, "studentId");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      parents: {
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  return student;
}

export async function updateStudent(payload: UpdateStudentPayload) {
  const schoolId = parseId(payload.schoolId, "schoolId");
  const studentId = parseId(payload.studentId, "studentId");
  const name = payload.name?.trim();
  const dob = parseOptionalDate(payload.dob);

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  let classId: number | undefined;
  if (payload.classId !== undefined) {
    classId = parseId(payload.classId, "classId");
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classRecord) {
      throw appErrors.notFound("Class not found");
    }
  }

  return prisma.student.update({
    where: { id: studentId },
    data: {
      ...(name ? { name } : {}),
      ...(classId ? { classId } : {}),
      ...(dob !== undefined ? { dob } : {}),
    },
  });
}

export async function deleteStudent(schoolIdValue: string, studentIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const studentId = parseId(studentIdValue, "studentId");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  await prisma.parentStudent.deleteMany({ where: { studentId } });
  await prisma.attendance.deleteMany({ where: { studentId } });
  await prisma.student.delete({ where: { id: studentId } });

  return { deleted: true };
}