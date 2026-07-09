import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

const DEFAULT_HISTORY_DAYS = 30;
const MAX_HISTORY_DAYS = 180;

interface GetChildAttendanceHistoryPayload {
  parentUserId: string;
  schoolId: string;
  studentId: string;
  from?: string;
  to?: string;
}

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

function parseDateOnly(value: string, fieldName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw appErrors.badRequest(`${fieldName} must use YYYY-MM-DD format`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function resolveDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDate = to ? parseDateOnly(to, "to") : today;
  const fromDate = from ? parseDateOnly(from, "from") : new Date(toDate);

  if (!from) {
    fromDate.setDate(fromDate.getDate() - (DEFAULT_HISTORY_DAYS - 1));
  }

  if (fromDate > toDate) {
    throw appErrors.badRequest("from must be before or equal to to");
  }

  const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (rangeDays > MAX_HISTORY_DAYS) {
    throw appErrors.badRequest(`Date range cannot exceed ${MAX_HISTORY_DAYS} days`);
  }

  toDate.setHours(23, 59, 59, 999);

  return { fromDate, toDate };
}

export async function getChildAttendanceHistory(payload: GetChildAttendanceHistoryPayload) {
  const parentUserId = parseId(payload.parentUserId, "parentUserId");
  const schoolId = parseId(payload.schoolId, "schoolId");
  const studentId = parseId(payload.studentId, "studentId");
  const { fromDate, toDate } = resolveDateRange(payload.from, payload.to);

  const parentLink = await prisma.parentStudent.findFirst({
    where: {
      parentUserId,
      studentId,
      student: {
        schoolId,
      },
    },
    include: {
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
  });

  if (!parentLink) {
    throw appErrors.notFound("Child not found");
  }

  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      date: true,
      status: true,
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      marked: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    student: parentLink.student,
    range: {
      from: formatDateOnly(fromDate),
      to: formatDateOnly(toDate),
    },
    attendance: records,
  };
}
