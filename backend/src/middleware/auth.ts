import type { NextFunction, Request, Response } from "express";
import { verifyJWT, type JWTPayload } from "../lib/auth-utils";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Auth middleware that verifies the JWT from the Authorization header.
 * Attaches the decoded user to req.user if valid.
 * Returns 401 if missing or invalid.
 */
export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      response.status(401).json({
        success: false,
        error: {
          message: "Missing authorization header",
          code: "MISSING_AUTH",
        },
      });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      response.status(401).json({
        success: false,
        error: {
          message: "Invalid authorization header format",
          code: "INVALID_AUTH_FORMAT",
        },
      });
      return;
    }

    const token = parts[1];
    const decoded = verifyJWT(token);
    request.user = decoded;
    next();
  } catch (error) {
    response.status(401).json({
      success: false,
      error: {
        message: "Invalid or expired token",
        code: "INVALID_TOKEN",
      },
    });
  }
}
