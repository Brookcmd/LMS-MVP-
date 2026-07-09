import type { Request, Response } from "express";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
} from "../services/student-service";
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

export async function createStudentHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await createStudent({
      schoolId: request.user.schoolId,
      name: request.body.name,
      classId: request.body.classId,
      dob: request.body.dob,
    });

    response.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function listStudentsHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await listStudents(request.user.schoolId);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function getStudentHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await getStudentById(request.user.schoolId, readParam(request.params.studentId));
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function updateStudentHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await updateStudent({
      schoolId: request.user.schoolId,
      studentId: readParam(request.params.studentId),
      name: request.body.name,
      classId: request.body.classId,
      dob: request.body.dob,
    });

    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function deleteStudentHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await deleteStudent(request.user.schoolId, readParam(request.params.studentId));
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}