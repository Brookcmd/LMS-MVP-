import type { Request, Response } from "express";
import * as assessmentService from "../services/assessment-service";
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

export async function createAssessmentHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await assessmentService.createAssessment(auth.userId, auth.schoolId, request.body);
    response.status(201).json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getTeacherAssessmentsHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await assessmentService.getTeacherAssessments(auth.userId, auth.schoolId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function deleteAssessmentHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const assessmentId = request.params.id as string;
    const data = await assessmentService.deleteAssessment(assessmentId, auth.userId, auth.schoolId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getParentAssessmentsHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const studentId = request.query.studentId;
    const data = await assessmentService.getParentAssessments(auth.userId, auth.schoolId, studentId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getStudentAssessmentsHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await assessmentService.getStudentAssessments(auth.userId, auth.schoolId);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}
