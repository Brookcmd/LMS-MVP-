import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

export async function listParents(schoolIdValue: string) {
  const schoolId = parseId(schoolIdValue, "schoolId");

  return prisma.user.findMany({
    where: {
      schoolId,
      role: "parent",
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
      parentChildren: {
        select: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}
