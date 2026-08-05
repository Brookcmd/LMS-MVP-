import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";
import { AssessmentType } from "@prisma/client";

function id(value: unknown, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${name}`);
  }
  return parsed;
}

const ALLOWED_TYPES = new Set<AssessmentType>(["assignment", "exam", "quiz", "project"]);

export async function createAssessment(
  teacherUserIdValue: string | number,
  schoolIdValue: string | number,
  payload: Record<string, unknown>
) {
  const teacherId = id(teacherUserIdValue, "teacherId");
  const schoolId = id(schoolIdValue, "schoolId");
  const classId = id(payload.classId, "classId");
  const subjectId = id(payload.subjectId, "subjectId");

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    throw appErrors.badRequest("Title is required");
  }

  const description = typeof payload.description === "string" ? payload.description.trim() : null;

  let type: AssessmentType = "assignment";
  if (payload.type) {
    const rawType = String(payload.type).toLowerCase() as AssessmentType;
    if (!ALLOWED_TYPES.has(rawType)) {
      throw appErrors.badRequest("Invalid assessment type. Must be assignment, exam, quiz, or project");
    }
    type = rawType;
  }

  if (!payload.dueDate) {
    throw appErrors.badRequest("Due date is required");
  }
  const dueDate = new Date(payload.dueDate as string);
  if (isNaN(dueDate.getTime())) {
    throw appErrors.badRequest("Invalid due date format");
  }

  // Verify teacher teaches this class and subject in this school
  const teachingAssignment = await prisma.teachingAssignment.findFirst({
    where: {
      classId,
      subjectId,
      teacherId,
      class: { schoolId },
    },
  });

  // Also fallback check if teacher is associated with class via ClassTeacher or homeroom
  if (!teachingAssignment) {
    const classTeacher = await prisma.classTeacher.findFirst({
      where: { classId, teacherId, class: { schoolId } },
    });
    const homeroom = await prisma.class.findFirst({
      where: { id: classId, homeroomTeacherId: teacherId, schoolId },
    });
    if (!classTeacher && !homeroom) {
      throw appErrors.forbidden("You are not assigned to teach this class and subject");
    }
  }

  return prisma.assessment.create({
    data: {
      title,
      description,
      type,
      dueDate,
      classId,
      subjectId,
      teacherId,
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });
}

export async function getTeacherAssessments(
  teacherUserIdValue: string | number,
  schoolIdValue: string | number
) {
  const teacherId = id(teacherUserIdValue, "teacherId");
  const schoolId = id(schoolIdValue, "schoolId");

  return prisma.assessment.findMany({
    where: {
      teacherId,
      class: { schoolId },
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function deleteAssessment(
  assessmentIdValue: string | number,
  teacherUserIdValue: string | number,
  schoolIdValue: string | number
) {
  const assessmentId = id(assessmentIdValue, "assessmentId");
  const teacherId = id(teacherUserIdValue, "teacherId");
  const schoolId = id(schoolIdValue, "schoolId");

  const existing = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      teacherId,
      class: { schoolId },
    },
  });

  if (!existing) {
    throw appErrors.notFound("Assessment not found or you do not have permission to delete it");
  }

  await prisma.assessment.delete({
    where: { id: assessmentId },
  });

  return { success: true, message: "Assessment deleted successfully" };
}

export async function getParentAssessments(
  parentUserIdValue: string | number,
  schoolIdValue: string | number,
  studentIdValue?: unknown
) {
  const parentUserId = id(parentUserIdValue, "parentUserId");
  const schoolId = id(schoolIdValue, "schoolId");

  // Fetch children of this parent
  const parentStudentLinks = await prisma.parentStudent.findMany({
    where: {
      parentUserId,
      student: { schoolId },
      ...(studentIdValue ? { studentId: id(studentIdValue, "studentId") } : {}),
    },
    include: {
      student: {
        select: { id: true, name: true, classId: true, class: { select: { id: true, name: true } } },
      },
    },
  });

  if (parentStudentLinks.length === 0) {
    return [];
  }

  const children = parentStudentLinks.map((link) => link.student);
  const classIds = Array.from(new Set(children.map((c) => c.classId)));

  const assessments = await prisma.assessment.findMany({
    where: {
      classId: { in: classIds },
    },
    include: {
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Attach which children belong to which assessment class
  const now = new Date();
  return assessments.map((item) => {
    const matchingChildren = children.filter((c) => c.classId === item.classId);
    const dueDate = new Date(item.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status: "overdue" | "today" | "upcoming" = "upcoming";
    if (diffMs < 0 && Math.abs(diffDays) > 0) {
      status = "overdue";
    } else if (dueDate.toDateString() === now.toDateString()) {
      status = "today";
    }

    return {
      ...item,
      students: matchingChildren,
      status,
      daysRemaining: diffDays,
    };
  });
}
