import type { Request, Response } from "express";
import { createAccount, login } from "../services/auth-service";
import { AuthError } from "../lib/auth-errors";

/**
 * Handler for POST /auth/signup
 * Creates a new teacher or parent account.
 * Requires authentication (admin-only, enforced by role middleware).
 * schoolId is pulled from req.user.schoolId, not from the request body.
 */
export async function signupHandler(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const { name, email, role, password } = request.body;

    // schoolId comes from the authenticated user's JWT
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

    const result = await createAccount({
      schoolId: request.user.schoolId,
      name,
      email,
      role,
      password,
    });

    response.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      response.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
    } else {
      throw error;
    }
  }
}

/**
 * Handler for POST /auth/login
 * Authenticates a user and returns a JWT.
 * No authentication required.
 */
export async function loginHandler(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const { email, password, schoolId } = request.body;

    const result = await login({
      schoolId,
      email,
      password,
    });

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      response.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
    } else {
      throw error;
    }
  }
}
