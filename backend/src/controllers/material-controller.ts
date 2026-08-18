import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createMaterial,
  deleteMaterial,
  listAdminMaterials,
  listClassMaterials,
  listStudentMaterials,
  listTeacherMaterials,
} from "../services/material-service";
import { AppError } from "../lib/app-error";
import { prisma } from "../lib/prisma";

// Ensure uploads directories exist
const materialsDir = path.join(process.cwd(), "uploads", "materials");
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, materialsDir);
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

export async function uploadMaterialHandler(req: Request, res: Response): Promise<void> {
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
      if (!auth || (auth.role !== "teacher" && auth.role !== "admin")) {
        res.status(403).json({ success: false, error: { message: "Only teachers and admins can upload course materials", code: "FORBIDDEN" } });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: { message: "No file was attached", code: "NO_FILE" } });
        return;
      }

      const { title, description, classId, subjectId, category } = req.body;
      if (!title || !classId || !subjectId) {
        res.status(400).json({
          success: false,
          error: { message: "title, classId, and subjectId are required", code: "MISSING_FIELDS" },
        });
        return;
      }

      const fileUrl = `/uploads/materials/${req.file.filename}`;

      const material = await createMaterial({
        title: String(title),
        description: description ? String(description) : undefined,
        category: category ? String(category) : undefined,
        classId: Number(classId),
        subjectId: Number(subjectId),
        teacherId: auth.userId,
        schoolId: auth.schoolId,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isAdmin: auth.role === "admin",
      });

      res.status(201).json({
        success: true,
        data: material,
      });
    } catch (error: any) {
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const code = error instanceof AppError ? error.code : "SERVER_ERROR";
      res.status(statusCode).json({ success: false, error: { message: error.message, code } });
    }
  });
}

export async function listAdminMaterialsHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== "admin") {
      res.status(403).json({ success: false, error: { message: "Admin access required", code: "FORBIDDEN" } });
      return;
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
    const gradeBand = req.query.gradeBand ? String(req.query.gradeBand) : undefined;

    const result = await listAdminMaterials(auth.schoolId, {
      page,
      limit,
      search,
      classId,
      subjectId,
      gradeBand,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error in listAdminMaterialsHandler:", error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}

export async function listTeacherMaterialsHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const materials = await listTeacherMaterials(auth.userId, auth.schoolId);
    res.status(200).json({ success: true, data: materials });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}

export async function listClassMaterialsHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const classId = Number(req.params.classId);
    const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;

    const materials = await listClassMaterials(classId, auth.schoolId, subjectId);
    res.status(200).json({ success: true, data: materials });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}

export async function listStudentMaterialsHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    let studentId: number | null = null;
    if (auth.role === "student") {
      // Find student record for user
      const studentProfile = await prisma.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
      });
      if (!studentProfile) {
        res.status(404).json({ success: false, error: { message: "Student profile not linked", code: "STUDENT_NOT_FOUND" } });
        return;
      }
      studentId = studentProfile.id;
    } else if (auth.role === "parent") {
      const qStudentId = req.query.studentId ? Number(req.query.studentId) : null;
      if (qStudentId) {
        studentId = qStudentId;
      } else {
        // Find first child
        const parentStudent = await prisma.parentStudent.findFirst({
          where: { parentUserId: auth.userId },
        });
        if (!parentStudent) {
          res.status(200).json({ success: true, data: [] });
          return;
        }
        studentId = parentStudent.studentId;
      }
    } else {
      res.status(403).json({ success: false, error: { message: "Only students and parents can use this endpoint", code: "FORBIDDEN" } });
      return;
    }

    if (!studentId) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
    const materials = await listStudentMaterials(studentId, auth.schoolId, subjectId);
    res.status(200).json({ success: true, data: materials });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}

export async function deleteMaterialHandler(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const materialId = Number(req.params.id);
    const result = await deleteMaterial(materialId, auth.userId, auth.role, auth.schoolId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json({ success: false, error: { message: error.message, code: error.code || "SERVER_ERROR" } });
  }
}
