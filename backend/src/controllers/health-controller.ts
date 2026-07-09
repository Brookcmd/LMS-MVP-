import type { Request, Response } from "express";

import { checkDatabaseHealth } from "../services/health-service";

export async function getHealth(_request: Request, response: Response) {
  try {
    response.status(200).json({
      success: true,
      data: await checkDatabaseHealth(),
    });
  } catch (error) {
    response.status(503).json({
      success: false,
      error: {
        message: "Database health check failed",
      },
    });
    console.error(error);
  }
}