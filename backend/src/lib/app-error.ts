export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const appErrors = {
  badRequest: (message: string, code = "BAD_REQUEST") =>
    new AppError(400, code, message),
  unauthorized: (message = "Unauthorized", code = "UNAUTHORIZED") =>
    new AppError(401, code, message),
  forbidden: (message = "Forbidden", code = "FORBIDDEN") =>
    new AppError(403, code, message),
  notFound: (message: string, code = "NOT_FOUND") =>
    new AppError(404, code, message),
  conflict: (message: string, code = "CONFLICT") =>
    new AppError(409, code, message),
};