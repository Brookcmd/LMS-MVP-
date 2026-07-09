import type { NextFunction, Request, Response } from "express";
import { AuthError } from "../lib/auth-errors";
import { AppError } from "../lib/app-error";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  console.error(error);

  // Handle typed application errors with status codes
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

  // Default: internal server error
  response.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
    },
  });
}