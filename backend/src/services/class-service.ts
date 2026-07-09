import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface CreateClassPayload {
  schoolId: string;
  name: string;
  teacherIds?: Array<string | number>;
}

export interface UpdateClassPayload {
  schoolId: string;
  classId: string;
  name?: string;
  teacherIds?: Array<string | number>;
}

function parseId(value: string | number, fieldName: string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

function parseIdList(values: Array<string | number> | undefined, fieldName: string): number[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  const parsed = values.map((value) => parseId(value, fieldName));
  return [...new Set(parsed)];
}

function assertTeacherRecords(teacherIds: number[], schoolId: number) {
  return prisma.user.findMany({
    where: {
      id: { in: teacherIds },
      schoolId,
      role: "teacher",
    },
    select: { id: true },
  });
}

export async function createClass(payload: CreateClassPayload) {
  const schoolId = parseId(payload.schoolId, "schoolId");
  const name = payload.name?.trim();
  const teacherIds = parseIdList(payload.teacherIds, "teacherIds");

  if (!name) {
    throw appErrors.badRequest("Missing required field: name");
  }

  if (teacherIds && teacherIds.length > 0) {
    const validTeachers = await assertTeacherRecords(teacherIds, schoolId);
    if (validTeachers.length !== teacherIds.length) {
      throw appErrors.badRequest("One or more teacherIds are invalid");
    }
  }

  return prisma.$transaction(async (transaction) => {
    const schoolClass = await transaction.class.create({
      data: {
        schoolId,
        name,
      },
    });

    if (teacherIds && teacherIds.length > 0) {
      await transaction.classTeacher.createMany({
        data: teacherIds.map((teacherId) => ({
          classId: schoolClass.id,
          teacherId,
        })),
        skipDuplicates: true,
      });
    }

    return transaction.class.findUniqueOrThrow({
      where: { id: schoolClass.id },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
              },
            },
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            dob: true,
            createdAt: true,
          },
        },
      },
    });
  });
}

export async function listClasses(schoolIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");

  return prisma.class.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      teachers: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      },
      students: {
        select: {
          id: true,
          name: true,
          dob: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getClassById(schoolIdValue: string, classIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const classId = parseId(classIdValue, "classId");

  const schoolClass = await prisma.class.findFirst({
    where: { id: classId, schoolId },
    include: {
      teachers: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      },
      students: {
        select: {
          id: true,
          name: true,
          dob: true,
          createdAt: true,
        },
      },
    },
  });

  if (!schoolClass) {
    throw appErrors.notFound("Class not found");
  }

  return schoolClass;
}

export async function updateClass(payload: UpdateClassPayload) {
  const schoolId = parseId(payload.schoolId, "schoolId");
  const classId = parseId(payload.classId, "classId");
  const name = payload.name?.trim();
  const teacherIds = parseIdList(payload.teacherIds, "teacherIds");

  const existingClass = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });

  if (!existingClass) {
    throw appErrors.notFound("Class not found");
  }

  if (teacherIds && teacherIds.length > 0) {
    const validTeachers = await assertTeacherRecords(teacherIds, schoolId);
    if (validTeachers.length !== teacherIds.length) {
      throw appErrors.badRequest("One or more teacherIds are invalid");
    }
  }

  return prisma.$transaction(async (transaction) => {
    if (name) {
      await transaction.class.update({
        where: { id: classId },
        data: { name },
      });
    }

    if (teacherIds) {
      await transaction.classTeacher.deleteMany({
        where: { classId },
      });

      if (teacherIds.length > 0) {
        await transaction.classTeacher.createMany({
          data: teacherIds.map((teacherId) => ({
            classId,
            teacherId,
          })),
        });
      }
    }

    return transaction.class.findUniqueOrThrow({
      where: { id: classId },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
              },
            },
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            dob: true,
            createdAt: true,
          },
        },
      },
    });
  });
}

export async function deleteClass(schoolIdValue: string, classIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const classId = parseId(classIdValue, "classId");

  const existingClass = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });

  if (!existingClass) {
    throw appErrors.notFound("Class not found");
  }

  const studentCount = await prisma.student.count({
    where: { classId },
  });

  if (studentCount > 0) {
    throw appErrors.conflict("Cannot delete a class that still has students assigned");
  }

  await prisma.classTeacher.deleteMany({ where: { classId } });
  await prisma.class.delete({ where: { id: classId } });

  return { deleted: true };
}