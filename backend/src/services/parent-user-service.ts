import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

export interface ListParentsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listParents(schoolIdValue: string, options: ListParentsOptions = {}) {
  const schoolId = parseId(schoolIdValue, "schoolId");
  const { page, limit, search } = options;

  const where: any = {
    schoolId,
    role: "parent",
  };

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { parentChildren: { some: { student: { name: { contains: term, mode: "insensitive" } } } } },
    ];
  }

  const isPaginated = page !== undefined || limit !== undefined;
  const pageNum = Math.max(1, page || 1);
  const takeLimit = limit ? Math.min(100, Math.max(1, limit)) : (isPaginated ? 50 : undefined);
  const skip = isPaginated ? (pageNum - 1) * (takeLimit || 50) : undefined;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: takeLimit,
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
            relationship: true,
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
          },
        },
      },
    }),
    prisma.user.count({ where }),
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
