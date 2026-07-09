import type { NextFunction, Request, Response } from "express";
import type { JWTPayload } from "../lib/auth-utils";

export function roleMiddleware(allowedRoles: JWTPayload["role"][]) {
  return function roleGuard(
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({
        success: false,
        error: {
          message: "Forbidden",
          code: "FORBIDDEN_ROLE",
        },
      });
      return;
    }

    next();
  };
}