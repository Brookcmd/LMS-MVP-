import type { Request, Response } from "express";
import { AppError } from "../lib/app-error";
import {
  listParentNotifications,
  markParentNotificationRead,
} from "../services/parent-notification-service";

function readParam(value: unknown): string | undefined {
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

export async function listParentNotificationsHandler(
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

    const notifications = await listParentNotifications({
      parentUserId: request.user.userId,
      schoolId: request.user.schoolId,
    });

    response.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    handleError(error, response);
  }
}

export async function markParentNotificationReadHandler(
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

    const notificationId = readParam(request.params.notificationId);
    if (!notificationId) {
      response.status(400).json({
        success: false,
        error: {
          message: "Missing required route parameter: notificationId",
          code: "BAD_REQUEST",
        },
      });
      return;
    }

    const notification = await markParentNotificationRead({
      parentUserId: request.user.userId,
      schoolId: request.user.schoolId,
      notificationId,
    });

    response.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    handleError(error, response);
  }
}
