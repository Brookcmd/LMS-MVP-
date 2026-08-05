import type { Request, Response } from "express";
import * as scheduleService from "../services/schedule-service";
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

export async function createSlotHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await scheduleService.createSlot(auth.userId, auth.schoolId, request.body);
    response.status(201).json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function updateSlotHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await scheduleService.updateSlot(
      request.params.id,
      auth.userId,
      auth.schoolId,
      request.body
    );
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function deleteSlotHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await scheduleService.deleteSlot(request.params.id, auth.userId, auth.schoolId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getTeacherScheduleHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await scheduleService.getTeacherSchedule(auth.userId, auth.schoolId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getParentScheduleHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const studentId = request.query.studentId;
    const data = await scheduleService.getParentSchedule(auth.userId, auth.schoolId, studentId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getClassScheduleHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await scheduleService.getClassSchedule(request.params.classId, auth.schoolId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}
