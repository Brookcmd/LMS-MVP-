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