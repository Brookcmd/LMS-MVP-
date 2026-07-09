import type { Request, Response } from "express";
import { getTeacherById, listTeachers } from "../services/teacher-service";
import { AuthError } from "../lib/auth-errors";
import { AppError } from "../lib/app-error";

function readParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function handleError(error: unknown, response: Response): void {
  if (error instanceof AuthError || error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  throw error;
}

export async function listTeachersHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await listTeachers(request.user.schoolId);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function getTeacherHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await getTeacherById(request.user.schoolId, readParam(request.params.teacherId));
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}