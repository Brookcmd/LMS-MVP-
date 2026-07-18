import type { Request, Response } from "express";
import {
  deleteParentStudentLink,
  listParentStudentLinks,
  listParentChildren,
  upsertParentStudentLink,
} from "../services/parent-student-service";
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

export async function listParentStudentLinksHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await listParentStudentLinks(request.user.schoolId);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function listParentChildrenHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await listParentChildren({
      parentUserId: request.user.userId,
      schoolId: request.user.schoolId,
    });

    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function upsertParentStudentLinkHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await upsertParentStudentLink({
      schoolId: request.user.schoolId,
      parentUserId: request.body.parentUserId,
      studentId: request.body.studentId,
      relationship: request.body.relationship,
      isPrimary: request.body.isPrimary,
    });

    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}

export async function deleteParentStudentLinkHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await deleteParentStudentLink(
      request.user.schoolId,
      readParam(request.params.parentUserId),
      readParam(request.params.studentId),
    );

    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}