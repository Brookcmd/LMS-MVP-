import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";
import { DayOfWeek } from "@prisma/client";

const DAYS_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const HH_MM = /^\d{2}:\d{2}$/;

function toInt(value: unknown, name: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw appErrors.badRequest(`Invalid ${name}`);
  return n;
}

function toDay(value: unknown): DayOfWeek {
  const raw = String(value ?? "").toLowerCase();
  if (!DAYS_ORDER.includes(raw as DayOfWeek)) {
    throw appErrors.badRequest(
      "dayOfWeek must be monday | tuesday | wednesday | thursday | friday"
    );
  }
  return raw as DayOfWeek;
}

function toTime(value: unknown, name: string): string {
  const raw = String(value ?? "");
  if (!HH_MM.test(raw)) throw appErrors.badRequest(`${name} must be HH:MM`);
  return raw;
}

// ────────────────────────────────────────
// Shared include block
// ────────────────────────────────────────

const SLOT_INCLUDE = {
  class: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
} as const;

// ────────────────────────────────────────
// Teacher CRUD
// ────────────────────────────────────────

export async function createSlot(
  adminUserIdValue: unknown,
  schoolIdValue: unknown,
  payload: Record<string, unknown>
) {
  const schoolId = toInt(schoolIdValue, "schoolId");
  const classId = toInt(payload.classId, "classId");
  const subjectId = toInt(payload.subjectId, "subjectId");
  const teacherId = payload.teacherId
    ? toInt(payload.teacherId, "teacherId")
    : toInt(adminUserIdValue, "teacherId");
  const dayOfWeek = toDay(payload.dayOfWeek);
  const startTime = toTime(payload.startTime, "startTime");
  const endTime = toTime(payload.endTime, "endTime");
  const room = typeof payload.room === "string" ? payload.room.trim() || null : null;

  if (startTime >= endTime) {
    throw appErrors.badRequest("startTime must be before endTime");
  }

  // Verify class belongs to the school
  const targetClass = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });
  if (!targetClass) {
    throw appErrors.notFound("Class not found");
  }

  return prisma.scheduleSlot.create({
    data: { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room },
    include: SLOT_INCLUDE,
  });
}

export async function updateSlot(
  slotIdValue: unknown,
  _adminUserIdValue: unknown,
  schoolIdValue: unknown,
  payload: Record<string, unknown>
) {
  const slotId = toInt(slotIdValue, "slotId");
  const schoolId = toInt(schoolIdValue, "schoolId");

  const existing = await prisma.scheduleSlot.findFirst({
    where: { id: slotId, class: { schoolId } },
  });
  if (!existing) {
    throw appErrors.notFound("Schedule slot not found");
  }

  const dayOfWeek = payload.dayOfWeek ? toDay(payload.dayOfWeek) : existing.dayOfWeek;
  const startTime = payload.startTime ? toTime(payload.startTime, "startTime") : existing.startTime;
  const endTime = payload.endTime ? toTime(payload.endTime, "endTime") : existing.endTime;
  const room =
    payload.room !== undefined
      ? typeof payload.room === "string"
        ? payload.room.trim() || null
        : null
      : existing.room;
  const teacherId = payload.teacherId ? toInt(payload.teacherId, "teacherId") : existing.teacherId;

  if (startTime >= endTime) {
    throw appErrors.badRequest("startTime must be before endTime");
  }

  return prisma.scheduleSlot.update({
    where: { id: slotId },
    data: { dayOfWeek, startTime, endTime, room, teacherId },
    include: SLOT_INCLUDE,
  });
}

export async function deleteSlot(
  slotIdValue: unknown,
  _adminUserIdValue: unknown,
  schoolIdValue: unknown
) {
  const slotId = toInt(slotIdValue, "slotId");
  const schoolId = toInt(schoolIdValue, "schoolId");

  const existing = await prisma.scheduleSlot.findFirst({
    where: { id: slotId, class: { schoolId } },
  });
  if (!existing) {
    throw appErrors.notFound("Schedule slot not found");
  }

  await prisma.scheduleSlot.delete({ where: { id: slotId } });
  return { success: true };
}

// ────────────────────────────────────────
// Read-only queries
// ────────────────────────────────────────

function sortSlots<T extends { dayOfWeek: DayOfWeek; startTime: string }>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const dA = DAYS_ORDER.indexOf(a.dayOfWeek);
    const dB = DAYS_ORDER.indexOf(b.dayOfWeek);
    if (dA !== dB) return dA - dB;
    return a.startTime.localeCompare(b.startTime);
  });
}

export async function getTeacherSchedule(
  teacherUserIdValue: unknown,
  schoolIdValue: unknown
) {
  const teacherId = toInt(teacherUserIdValue, "teacherId");
  const schoolId = toInt(schoolIdValue, "schoolId");

  const slots = await prisma.scheduleSlot.findMany({
    where: { teacherId, class: { schoolId } },
    include: SLOT_INCLUDE,
  });

  return sortSlots(slots);
}

export async function getParentSchedule(
  parentUserIdValue: unknown,
  schoolIdValue: unknown,
  studentIdValue?: unknown
) {
  const parentUserId = toInt(parentUserIdValue, "parentUserId");
  const schoolId = toInt(schoolIdValue, "schoolId");

  const links = await prisma.parentStudent.findMany({
    where: {
      parentUserId,
      student: { schoolId },
      ...(studentIdValue ? { studentId: toInt(studentIdValue, "studentId") } : {}),
    },
    include: {
      student: {
        select: { id: true, name: true, classId: true, class: { select: { id: true, name: true } } },
      },
    },
  });

  if (links.length === 0) return [];

  const children = links.map((l) => l.student);
  const classIds = [...new Set(children.map((c) => c.classId))];

  const slots = await prisma.scheduleSlot.findMany({
    where: { classId: { in: classIds } },
    include: SLOT_INCLUDE,
  });

  // Annotate each slot with which children attend that class
  const sorted = sortSlots(slots);
  return sorted.map((slot) => ({
    ...slot,
    students: children.filter((c) => c.classId === slot.classId),
  }));
}

export async function getClassSchedule(
  classIdValue: unknown,
  schoolIdValue: unknown
) {
  const classId = toInt(classIdValue, "classId");
  const schoolId = toInt(schoolIdValue, "schoolId");

  const cls = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });
  if (!cls) throw appErrors.notFound("Class not found");

  const slots = await prisma.scheduleSlot.findMany({
    where: { classId, class: { schoolId } },
    include: SLOT_INCLUDE,
  });

  return sortSlots(slots);
}
