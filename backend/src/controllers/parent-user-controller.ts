import type { Request, Response } from "express";
import { listParents } from "../services/parent-user-service";
import { AuthError } from "../lib/auth-errors";
import { AppError } from "../lib/app-error";

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

export async function listParentsHandler(request: Request, response: Response): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const result = await listParents(request.user.schoolId);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}
