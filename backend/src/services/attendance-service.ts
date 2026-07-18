import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";
import { AttendanceStatus, type Prisma } from "@prisma/client";

interface MarkAttendanceRequest {
  studentId: number;
  status: AttendanceStatus;
}

interface MarkAttendanceBatchPayload {
  classId: number;
  date: string; // ISO 8601 date string YYYY-MM-DD
  marks: MarkAttendanceRequest[];
}

interface AttendanceResult {
  created: number;
  updated: number;
  notificationsCreated: number;
}

function parseAttendanceDate(dateString: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw appErrors.badRequest("date must use YYYY-MM-DD format");
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    throw appErrors.badRequest("Invalid date");
  }

  return parsed;
}

/**
 * Validate that a date is within the allowed window (today to 7 days in the past)
 */
function validateDateWindow(dateString: string): void {
  const markDate = parseAttendanceDate(dateString);
  const today = new Date();

  // Set time to midnight for comparison
  markDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // Date must not be in the future
  if (markDate > today) {
    throw appErrors.badRequest(
      "Attendance cannot be marked for future dates"
    );
  }

  // Date must not be more than 7 days in the past
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (markDate < sevenDaysAgo) {
    throw appErrors.badRequest(
      "Attendance can only be marked for the current date or up to 7 days in the past"
    );
  }
}

/**
 * Verify that all studentIds exist and belong to the specified class
 */
async function validateStudentsInClass(
  classId: number,
  studentIds: number[]
): Promise<void> {
  if (studentIds.length === 0) {
    throw appErrors.badRequest("No attendance marks provided");
  }

  // Check for duplicates
  const uniqueIds = new Set(studentIds);
  if (uniqueIds.size !== studentIds.length) {
    throw appErrors.badRequest(
      "Duplicate student IDs in attendance marks"
    );
  }

  // Verify all students exist and belong to this class
  const studentsInClass = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      classId,
    },
    select: { id: true },
  });

  if (studentsInClass.length !== studentIds.length) {
    throw appErrors.badRequest(
      "One or more students do not belong to this class"
    );
  }
}

/**
 * Verify that the teacher is assigned to the class
 */
async function validateTeacherOwnsClass(
  teacherId: number,
  classId: number
): Promise<void> {
  const assignment = await prisma.classTeacher.findUnique({
    where: {
      classId_teacherId: {
        classId,
        teacherId,
      },
    },
  });

  if (!assignment) {
    throw appErrors.forbidden(
      "Teacher is not assigned to this class"
    );
  }
}

async function createAbsenceNotifications(
  tx: Prisma.TransactionClient,
  attendance: { id: number; studentId: number }
): Promise<number> {
  const parentLinks = await tx.parentStudent.findMany({
    where: {
      studentId: attendance.studentId,
    },
    select: {
      parentUserId: true,
    },
  });

  if (parentLinks.length === 0) {
    return 0;
  }

  const result = await tx.notification.createMany({
    data: parentLinks.map((link) => ({
      parentUserId: link.parentUserId,
      studentId: attendance.studentId,
      attendanceId: attendance.id,
      type: "absence",
    })),
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Mark attendance for multiple students in a class for a given date
 * Validates teacher ownership, date window, and student membership
 * Uses upsert to handle re-submissions (create if missing, update if exists)
 */
export async function markAttendanceBatch(
  teacherId: number,
  payload: MarkAttendanceBatchPayload
): Promise<AttendanceResult> {
  const { classId, date, marks } = payload;

  // Validate date window (today to 7 days back)
  validateDateWindow(date);

  // Validate teacher is assigned to this class
  await validateTeacherOwnsClass(teacherId, classId);

  // Extract student IDs and validate they exist and belong to this class
  const studentIds = marks.map((m) => m.studentId);
  await validateStudentsInClass(classId, studentIds);

  // Validate status values
  const validStatuses = ["present", "absent", "late"];
  for (const mark of marks) {
    if (!validStatuses.includes(mark.status)) {
      throw appErrors.badRequest(
        `Invalid status: ${mark.status}. Must be one of: ${validStatuses.join(", ")}`
      );
    }
  }

  // Parse the date
  const attendanceDate = parseAttendanceDate(date);

  // Upsert each attendance record in a transaction
  const result = await prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    let notificationsCreated = 0;

    for (const mark of marks) {
      const existing = await tx.attendance.findUnique({
        where: {
          studentId_classId_date: {
            studentId: mark.studentId,
            classId,
            date: attendanceDate,
          },
        },
      });

      let attendance: { id: number; studentId: number } | null = null;

      if (existing) {
        attendance = await tx.attendance.update({
          where: { id: existing.id },
          data: { status: mark.status as AttendanceStatus },
          select: {
            id: true,
            studentId: true,
          },
        });
        updated++;
      } else {
        attendance = await tx.attendance.create({
          data: {
            studentId: mark.studentId,
            classId,
            date: attendanceDate,
            status: mark.status as AttendanceStatus,
            markedBy: teacherId,
          },
          select: {
            id: true,
            studentId: true,
          },
        });
        created++;
      }

      if (mark.status === "absent" && attendance) {
        notificationsCreated += await createAbsenceNotifications(tx, attendance);
      }
    }

    return { created, updated, notificationsCreated };
  });

  return result;
}

/**
 * Get the class roster with attendance status for a specific date
 */
export async function getAttendanceByClass(
  teacherId: number,
  classId: number,
  date: string
) {
  const attendanceDate = parseAttendanceDate(date);

  await validateTeacherOwnsClass(teacherId, classId);

  const students = await prisma.student.findMany({
    where: {
      classId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      attendances: {
        where: {
          classId,
          date: attendanceDate,
        },
        select: {
          id: true,
          status: true,
          date: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 1,
      },
    },
  });

  return students.map((student) => {
    const attendance = student.attendances[0];

    return {
      id: attendance?.id ?? null,
      status: attendance?.status ?? null,
      date: attendance?.date ?? attendanceDate,
      createdAt: attendance?.createdAt ?? null,
      updatedAt: attendance?.updatedAt ?? null,
      student: {
        id: student.id,
        name: student.name,
      },
    };
  });
}
