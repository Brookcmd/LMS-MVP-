import type { Request, Response } from "express";
import * as notificationService from "../services/notification-service";
import { AppError } from "../lib/app-error";

function fail(error: unknown, response: Response) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: { message: error.message, code: error.code },
    });
    return;
  }
  throw error;
}

function user(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
    return null;
  }
  return request.user;
}

function parseNum(val: string): number {
  return Number.parseInt(val, 10);
}

export async function listNotificationsHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await notificationService.listUserNotifications(parseNum(auth.userId), parseNum(auth.schoolId));
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function markNotificationReadHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const notificationId = request.params.id as string;
    const data = await notificationService.markNotificationRead(notificationId, parseNum(auth.userId));
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}
