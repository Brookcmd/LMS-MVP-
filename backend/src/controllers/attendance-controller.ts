import { Request, Response } from "express";
import * as attendanceService from "../services/attendance-service";
import { appErrors } from "../lib/app-error";

function handleError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  }
  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
}

export async function markAttendanceBatchHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const { classId, date, marks } = req.body;

    // Basic validation
    if (!classId || !date || !marks) {
      throw appErrors.badRequest(
        "Missing required fields: classId, date, marks"
      );
    }

    if (!Array.isArray(marks)) {
      throw appErrors.badRequest("marks must be an array");
    }

    const teacherId = parseInt(req.user.userId, 10);
    const result = await attendanceService.markAttendanceBatch(
      teacherId,
      {
        classId,
        date,
        marks,
      }
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Check if it's an AppError or AuthError
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      "code" in error &&
      "message" in error
    ) {
      const typedError = error as {
        statusCode: number;
        code: string;
        message: string;
      };
      res.status(typedError.statusCode).json({
        success: false,
        error: {
          message: typedError.message,
          code: typedError.code,
        },
      });
      return;
    }

    handleError(res, error);
  }
}

export async function getAttendanceByClassHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const classId = req.query.classId
      ? parseInt(req.query.classId as string)
      : null;
    const date = req.query.date as string;

    if (!classId || !date) {
      throw appErrors.badRequest(
        "Missing required query parameters: classId, date"
      );
    }

    const attendance = await attendanceService.getAttendanceByClass(
      classId,
      date
    );

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      "code" in error
    ) {
      const typedError = error as {
        statusCode: number;
        code: string;
        message: string;
      };
      res.status(typedError.statusCode).json({
        success: false,
        error: {
          message: typedError.message,
          code: typedError.code,
        },
      });
      return;
    }

    handleError(res, error);
  }
}
