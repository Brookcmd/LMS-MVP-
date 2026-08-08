import type { Request, Response } from "express";
import * as messageService from "../services/message-service";
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

export async function listConversationsHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await messageService.listConversations(parseNum(auth.userId), auth.role, parseNum(auth.schoolId));
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function createConversationHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const data = await messageService.getOrCreateConversation(parseNum(auth.userId), auth.role, parseNum(auth.schoolId), request.body);
    response.status(201).json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function getConversationDetailsHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const conversationId = request.params.id as string;
    const page = request.query.page ? Number.parseInt(String(request.query.page), 10) : 1;
    const limit = request.query.limit ? Number.parseInt(String(request.query.limit), 10) : 50;

    const data = await messageService.getConversationDetails(
      conversationId,
      parseNum(auth.userId),
      auth.role,
      parseNum(auth.schoolId),
      page,
      limit
    );
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function sendMessageHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const conversationId = request.params.id as string;
    const data = await messageService.sendMessage(
      conversationId,
      parseNum(auth.userId),
      auth.role,
      parseNum(auth.schoolId),
      request.body
    );
    response.status(201).json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}

export async function markConversationReadHandler(request: Request, response: Response) {
  try {
    const auth = user(request, response);
    if (!auth) return;
    const conversationId = request.params.id as string;
    const data = await messageService.markConversationRead(conversationId, parseNum(auth.userId), auth.role);
    response.json({ success: true, data });
  } catch (error) {
    fail(error, response);
  }
}
