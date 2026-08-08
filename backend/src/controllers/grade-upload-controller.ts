import type { Request, Response } from "express";
import multer from "multer";
import { AppError } from "../lib/app-error";
import { generateGradeTemplate, processGradeUpload } from "../services/grade-upload-service";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function user(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    return null;
  }
  return request.user;
}

function fail(error: unknown, response: Response) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ success: false, error: { message: error.message, code: error.code } });
    return;
  }
  throw error;
}

// Multer configured for single .xlsx file upload, 2 MB limit, memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().split(".").pop();
    if (ext !== "xlsx") {
      cb(new AppError(400, "BAD_REQUEST", "Only .xlsx files are accepted"));
      return;
    }
    cb(null, true);
  },
}).single("file");

export async function downloadTemplateHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;

    const { buffer, filename } = await generateGradeTemplate(
      one(request.params.assignmentId),
      auth.userId,
      auth.schoolId,
      request.query.academicYear,
      request.query.quarter,
    );

    response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.send(buffer);
  } catch (error) {
    fail(error, response);
  }
}

export async function uploadGradesHandler(request: Request, response: Response) {
  // Run multer middleware to parse the multipart upload
  upload(request, response, async (multerError) => {
    try {
      if (multerError) {
        if (multerError instanceof multer.MulterError && multerError.code === "LIMIT_FILE_SIZE") {
          response.status(400).json({ success: false, error: { message: "File exceeds 2 MB size limit", code: "BAD_REQUEST" } });
          return;
        }
        if (multerError instanceof AppError) {
          response.status(multerError.statusCode).json({ success: false, error: { message: multerError.message, code: multerError.code } });
          return;
        }
        response.status(400).json({ success: false, error: { message: "File upload failed", code: "BAD_REQUEST" } });
        return;
      }

      const auth = user(request, response);
      if (!auth) return;

      if (!request.file) {
        response.status(400).json({ success: false, error: { message: "No file uploaded. Send a .xlsx file in the 'file' field.", code: "BAD_REQUEST" } });
        return;
      }

      const result = await processGradeUpload(
        one(request.params.assignmentId),
        auth.userId,
        auth.schoolId,
        request.query.academicYear,
        request.query.quarter,
        request.file.buffer,
      );

      // Row-level validation failures → standard failure response per code-standards.md
      if (result.errors && result.errors.length > 0) {
        response.status(422).json({
          success: false,
          error: {
            message: "Upload failed validation",
            code: "VALIDATION_FAILED",
            details: result.errors,
          },
        });
        return;
      }

      // All rows saved successfully
      response.json({
        success: true,
        data: {
          saved: result.saved,
          academicYear: result.academicYear,
          quarter: result.quarter,
        },
      });
    } catch (error) {
      fail(error, response);
    }
  });
}
