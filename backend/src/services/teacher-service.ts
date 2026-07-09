import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

export async function listTeachers(schoolIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");

  return prisma.user.findMany({
    where: {
      schoolId,
      role: "teacher",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      schoolId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      classesTeaching: {
        select: {
          class: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

export async function getTeacherById(schoolIdValue: string, teacherIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const teacherId = parseId(teacherIdValue, "teacherId");

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId,
      role: "teacher",
    },
    select: {
      id: true,
      schoolId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      classesTeaching: {
        select: {
          class: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    throw appErrors.notFound("Teacher not found");
  }

  return teacher;
}