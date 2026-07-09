import type { Request, Response } from "express";
import { AppError } from "../lib/app-error";
import { getChildAttendanceHistory } from "../services/parent-attendance-service";

function readQuery(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === "string" ? firstValue : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function handleError(error: unknown, response: Response): void {
  if (error instanceof AppError) {
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

export async function getChildAttendanceHistoryHandler(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      });
      return;
    }

    const studentId = readQuery(request.query.studentId);
    if (!studentId) {
      response.status(400).json({
        success: false,
        error: {
          message: "Missing required query parameter: studentId",
          code: "BAD_REQUEST",
        },
      });
      return;
    }

    const result = await getChildAttendanceHistory({
      parentUserId: request.user.userId,
      schoolId: request.user.schoolId,
      studentId,
      from: readQuery(request.query.from),
      to: readQuery(request.query.to),
    });

    response.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, response);
  }
}
