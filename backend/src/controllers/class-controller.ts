import type { Request, Response } from "express";
import {
  createClass,
  deleteClass,
  getClassById,
  listClasses,
  updateClass,
} from "../services/class-service";
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

export async function createClassHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    const result = await createClass({
      schoolId: request.user.schoolId,
      name: request.body.name,
      teacherIds: request.body.teacherIds,
    });

    response.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function listClassesHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    const result = await listClasses(request.user.schoolId);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function getClassHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    const result = await getClassById(request.user.schoolId, readParam(request.params.classId));
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function updateClassHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    const result = await updateClass({
      schoolId: request.user.schoolId,
      classId: readParam(request.params.classId),
      name: request.body.name,
      teacherIds: request.body.teacherIds,
    });

    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function deleteClassHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    const result = await deleteClass(request.user.schoolId, readParam(request.params.classId));
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}