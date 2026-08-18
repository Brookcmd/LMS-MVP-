import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";
import { hashPassword } from "../lib/auth-utils";

export interface CreateStudentPayload {
  schoolId: string;
  name: string;
  classId: string;
  dob?: string | null;
}

export interface ProvisionStudentAccountPayload {
  email: string;
  password?: string;
  name?: string;
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

export interface ListStudentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  classId?: number;
  gradeBand?: string;
}

export async function listStudents(schoolIdValue: string, options: ListStudentsOptions = {}) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const { page, limit, search, classId, gradeBand } = options;

  const where: any = { schoolId };

  if (classId) {
    where.classId = classId;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { class: { name: { contains: term, mode: "insensitive" } } },
      { parents: { some: { parent: { name: { contains: term, mode: "insensitive" } } } } },
    ];
  }

  if (gradeBand) {
    const gb = gradeBand.toLowerCase();
    if (gb === "kg") {
      where.class = { ...where.class, name: { startsWith: "KG", mode: "insensitive" } };
    } else if (gb === "primary") {
      where.class = {
        ...where.class,
        OR: [1, 2, 3, 4, 5, 6, 7, 8].map((g) => ({
          name: { startsWith: `Grade ${g}`, mode: "insensitive" },
        })),
      };
    } else if (gb === "high") {
      where.class = {
        ...where.class,
        OR: [9, 10].map((g) => ({
          name: { startsWith: `Grade ${g}`, mode: "insensitive" },
        })),
      };
    } else if (gb === "prep") {
      where.class = {
        ...where.class,
        OR: [11, 12].map((g) => ({
          name: { startsWith: `Grade ${g}`, mode: "insensitive" },
        })),
      };
    }
  }

  const isPaginated = page !== undefined || limit !== undefined;
  const pageNum = Math.max(1, page || 1);
  const takeLimit = limit ? Math.min(100, Math.max(1, limit)) : (isPaginated ? 50 : undefined);
  const skip = isPaginated ? (pageNum - 1) * (takeLimit || 50) : undefined;

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: takeLimit,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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
    }),
    prisma.student.count({ where }),
  ]);

  const effectiveLimit = takeLimit || total || 1;
  const totalPages = Math.ceil(total / effectiveLimit) || 1;

  return {
    items,
    total,
    page: pageNum,
    limit: effectiveLimit,
    totalPages,
  };
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
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

export async function provisionStudentAccount(
  schoolIdValue: string,
  studentIdValue: string,
  payload: ProvisionStudentAccountPayload
) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const studentId = parseId(studentIdValue, "studentId");
  const email = payload.email?.trim().toLowerCase();
  const rawPassword = payload.password || "Student@123";
  const name = payload.name?.trim();

  if (!email) {
    throw appErrors.badRequest("Email is required to provision student account");
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { user: true },
  });

  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  // Check if email is already taken by another user in this school
  const existingUserWithEmail = await prisma.user.findFirst({
    where: {
      schoolId,
      email,
      NOT: student.userId ? { id: student.userId } : undefined,
    },
  });

  if (existingUserWithEmail) {
    throw appErrors.conflict("An account with this email already exists in this school");
  }

  const passwordHash = await hashPassword(rawPassword);

  let userRecord;
  if (student.userId && student.user) {
    // Update existing user account
    userRecord = await prisma.user.update({
      where: { id: student.userId },
      data: {
        email,
        name: name || student.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  } else {
    // Create new user account & link to student
    userRecord = await prisma.user.create({
      data: {
        schoolId,
        role: "student",
        name: name || student.name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await prisma.student.update({
      where: { id: studentId },
      data: { userId: userRecord.id },
    });
  }

  return {
    studentId,
    user: userRecord,
    message: "Student login account provisioned successfully",
  };
}

export async function deactivateStudentAccount(schoolIdValue: string, studentIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const studentId = parseId(studentIdValue, "studentId");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });

  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  if (student.userId) {
    const userIdToDelete = student.userId;
    // Unlink first
    await prisma.student.update({
      where: { id: studentId },
      data: { userId: null },
    });

    // Delete user record
    await prisma.user.delete({
      where: { id: userIdToDelete },
    }).catch(() => null);
  }

  return {
    studentId,
    unlinked: true,
    message: "Student login account deactivated successfully",
  };
}