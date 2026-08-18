import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface SubmitAssignmentInput {
  assessmentId: number;
  studentId: number;
  schoolId: number;
  content?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface GradeSubmissionInput {
  submissionId: number;
  teacherId: number;
  role: string;
  schoolId: number;
  gradeScore: number;
  feedback?: string;
}

/**
 * Submit or update homework/assignment submission for a student
 */
export async function submitAssignment(input: SubmitAssignmentInput) {
  // Validate assessment exists
  const assessment = await prisma.assessment.findFirst({
    where: { id: input.assessmentId, class: { schoolId: input.schoolId } },
    include: { class: true },
  });

  if (!assessment) {
    throw appErrors.notFound("Assessment not found", "ASSESSMENT_NOT_FOUND");
  }

  // Validate student belongs to class
  const student = await prisma.student.findFirst({
    where: { id: input.studentId, schoolId: input.schoolId },
  });

  if (!student) {
    throw appErrors.notFound("Student not found", "STUDENT_NOT_FOUND");
  }

  if (student.classId !== assessment.classId) {
    throw appErrors.forbidden("Student is not enrolled in this assessment's class", "NOT_ENROLLED");
  }

  const now = new Date();
  const isLate = now > new Date(assessment.dueDate);
  const status = isLate ? "late" : "submitted";

  // Upsert submission
  const submission = await prisma.submission.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId: input.assessmentId,
        studentId: input.studentId,
      },
    },
    update: {
      content: input.content !== undefined ? input.content : undefined,
      ...(input.fileUrl
        ? {
            fileUrl: input.fileUrl,
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
          }
        : {}),
      submittedAt: now,
      status: status,
    },
    create: {
      assessmentId: input.assessmentId,
      studentId: input.studentId,
      content: input.content || null,
      fileUrl: input.fileUrl || null,
      fileName: input.fileName || null,
      fileSize: input.fileSize || null,
      mimeType: input.mimeType || null,
      submittedAt: now,
      status: status,
    },
    include: {
      student: { select: { id: true, name: true } },
      assessment: {
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          subject: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  return submission;
}

/**
 * Get a specific student's submission for an assessment
 */
export async function getStudentSubmission(assessmentId: number, studentId: number, schoolId: number) {
  const submission = await prisma.submission.findFirst({
    where: {
      assessmentId,
      studentId,
      assessment: { class: { schoolId } },
    },
    include: {
      student: { select: { id: true, name: true } },
      assessment: {
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          subject: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  return submission;
}

/**
 * List all submissions for an assessment (Teacher/Admin view with enrolled roster)
 */
export async function listAssessmentSubmissions(assessmentId: number, teacherId: number, role: string, schoolId: number) {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, class: { schoolId } },
    include: {
      class: {
        include: {
          students: {
            select: { id: true, name: true, dob: true },
            orderBy: { name: "asc" },
          },
        },
      },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  if (!assessment) {
    throw appErrors.notFound("Assessment not found", "ASSESSMENT_NOT_FOUND");
  }

  if (role !== "admin" && assessment.teacherId !== teacherId) {
    // Check if teacher is assigned to class
    const assignment = await prisma.classTeacher.findFirst({
      where: { classId: assessment.classId, teacherId },
    });
    if (!assignment) {
      throw appErrors.forbidden("Unauthorized to view submissions for this assessment", "FORBIDDEN");
    }
  }

  const submissions = await prisma.submission.findMany({
    where: { assessmentId },
    include: {
      student: { select: { id: true, name: true } },
    },
  });

  const submissionMap = new Map<number, typeof submissions[0]>();
  for (const s of submissions) {
    submissionMap.set(s.studentId, s);
  }

  // Combine enrolled roster with submissions
  const roster = assessment.class.students.map((student) => {
    const sub = submissionMap.get(student.id);
    return {
      student: { id: student.id, name: student.name },
      hasSubmitted: !!sub,
      submission: sub || null,
    };
  });

  const totalStudents = roster.length;
  const submittedCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      dueDate: assessment.dueDate,
      class: assessment.class.name,
      subject: assessment.subject.name,
      totalStudents,
      submittedCount,
      gradedCount,
    },
    roster,
  };
}

/**
 * Grade a submission
 */
export async function gradeSubmission(input: GradeSubmissionInput) {
  const submission = await prisma.submission.findFirst({
    where: { id: input.submissionId, assessment: { class: { schoolId: input.schoolId } } },
    include: {
      assessment: true,
      student: true,
    },
  });

  if (!submission) {
    throw appErrors.notFound("Submission not found", "SUBMISSION_NOT_FOUND");
  }

  if (input.role !== "admin" && submission.assessment.teacherId !== input.teacherId) {
    throw appErrors.forbidden("Unauthorized to grade this submission", "FORBIDDEN");
  }

  if (typeof input.gradeScore !== "number" || input.gradeScore < 0 || input.gradeScore > 100) {
    throw appErrors.badRequest("Score must be between 0 and 100", "INVALID_SCORE");
  }

  const updated = await prisma.submission.update({
    where: { id: input.submissionId },
    data: {
      gradeScore: Math.round(input.gradeScore),
      feedback: input.feedback?.trim() || null,
      gradedAt: new Date(),
      status: "graded",
    },
    include: {
      student: { select: { id: true, name: true } },
      assessment: { select: { id: true, title: true } },
    },
  });

  return updated;
}
