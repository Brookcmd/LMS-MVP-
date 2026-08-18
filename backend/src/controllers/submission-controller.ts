import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getStudentSubmission,
  gradeSubmission,
  listAssessmentSubmissions,
  submitAssignment,
} from "../services/submission-service";
import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";

// Ensure submissions uploads directory exists
const submissionsDir = path.join(process.cwd(), "uploads", "submissions");
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, submissionsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single("file");

function getAuthUser(req: Request) {
  if (!req.user) return null;
  const userId = Number(req.user.userId || (req.user as any).id);
  const schoolId = Number(req.user.schoolId);
  const role = req.user.role;
  return { userId, schoolId, role };
}

export async function submitAssignmentHandler(req: Request, res: Response): Promise<void> {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ success: false, error: { message: "File exceeds maximum size of 50MB", code: "FILE_TOO_LARGE" } });
        return;
      }
      res.status(400).json({ success: false, error: { message: err.message || "File upload error", code: "UPLOAD_ERROR" } });
      return;
    }

    try {
      const auth = getAuthUser(req);
      if (!auth) {
        res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
        return;
      }

      const assessmentId = Number(req.params.assessmentId);
      const { content } = req.body;

      let studentId: number | null = null;
      if (auth.role === "student") {
        const studentProfile = await prisma.student.findFirst({
          where: { userId: auth.userId, schoolId: auth.schoolId },
        });
        if (!studentProfile) {
          res.status(404).json({ success: false, error: { message: "Student profile not found", code: "STUDENT_NOT_FOUND" } });
          return;
        }
        studentId = studentProfile.id;
      } else if (auth.role === "parent") {
        const reqStudentId = req.body.studentId ? Number(req.body.studentId) : null;
        if (!reqStudentId) {
          res.status(400).json({ success: false, error: { message: "studentId is required for parent submissions", code: "MISSING_STUDENT_ID" } });
          return;
        }
        // Verify parent is linked to student
        const link = await prisma.parentStudent.findFirst({
          where: { parentUserId: auth.userId, studentId: reqStudentId },
        });
        if (!link) {
          res.status(403).json({ success: false, error: { message: "Unauthorized for this student", code: "FORBIDDEN" } });
          return;
        }
        studentId = reqStudentId;
      } else {
        res.status(403).json({ success: false, error: { message: "Only students and parents can submit assignments", code: "FORBIDDEN" } });
        return;
      }

      const fileUrl = req.file ? `/uploads/submissions/${req.file.filename}` : undefined;

      const submission = await submitAssignment({
        assessmentId,
        studentId,
        schoolId: auth.schoolId,
        content: content ? String(content).trim() : undefined,
        fileName: req.file ? req.file.originalname : undefined,
        fileUrl,
        fileSize: req.file ? req.file.size : undefined,
        mimeType: req.file ? req.file.mimetype : undefined,
      });

      res.status(200).json({ success: true, data: submission });
    } catch (error: any) {
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
    }
  });
}

export async function getStudentSubmissionHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const assessmentId = Number(req.params.assessmentId);
    let studentId: number | null = null;

    if (auth.role === "student") {
      const studentProfile = await prisma.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
      });
      if (!studentProfile) {
        res.status(404).json({ success: false, error: { message: "Student profile not found", code: "STUDENT_NOT_FOUND" } });
        return;
      }
      studentId = studentProfile.id;
    } else if (auth.role === "parent") {
      const qStudentId = req.query.studentId ? Number(req.query.studentId) : null;
      if (qStudentId) {
        studentId = qStudentId;
      } else {
        const link = await prisma.parentStudent.findFirst({
          where: { parentUserId: auth.userId },
        });
        if (!link) {
          res.status(200).json({ success: true, data: null });
          return;
        }
        studentId = link.studentId;
      }
    } else if (auth.role === "teacher" || auth.role === "admin") {
      const qStudentId = req.query.studentId ? Number(req.query.studentId) : null;
      if (!qStudentId) {
        res.status(400).json({ success: false, error: { message: "studentId query parameter is required", code: "MISSING_STUDENT_ID" } });
        return;
      }
      studentId = qStudentId;
    }

    if (!studentId) {
      res.status(400).json({ success: false, error: { message: "Student ID could not be determined", code: "INVALID_STUDENT" } });
      return;
    }

    const submission = await getStudentSubmission(assessmentId, studentId, auth.schoolId);
    res.status(200).json({ success: true, data: submission });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}

export async function listAssessmentSubmissionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth || (auth.role !== "teacher" && auth.role !== "admin")) {
      res.status(403).json({ success: false, error: { message: "Only teachers and admins can view submissions roster", code: "FORBIDDEN" } });
      return;
    }

    const assessmentId = Number(req.params.assessmentId);
    const data = await listAssessmentSubmissions(assessmentId, auth.userId, auth.role, auth.schoolId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}

export async function gradeSubmissionHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth || (auth.role !== "teacher" && auth.role !== "admin")) {
      res.status(403).json({ success: false, error: { message: "Only teachers and admins can grade submissions", code: "FORBIDDEN" } });
      return;
    }

    const submissionId = Number(req.params.submissionId);
    const { gradeScore, feedback } = req.body;

    if (gradeScore === undefined || gradeScore === null || isNaN(Number(gradeScore))) {
      res.status(400).json({ success: false, error: { message: "Valid numeric gradeScore is required", code: "INVALID_SCORE" } });
      return;
    }

    const updated = await gradeSubmission({
      submissionId,
      teacherId: auth.userId,
      role: auth.role,
      schoolId: auth.schoolId,
      gradeScore: Number(gradeScore),
      feedback: feedback ? String(feedback) : undefined,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}
