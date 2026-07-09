/**
 * Custom error class for auth-related errors.
 * Includes an HTTP status code for the error handler to use.
 */
export class AuthError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const authErrors = {
  emailAlreadyExists: (email: string) =>
    new AuthError(409, "EMAIL_EXISTS", `Email ${email} already exists in this school`),
  userNotFound: () =>
    new AuthError(401, "USER_NOT_FOUND", "User not found"),
  invalidPassword: () =>
    new AuthError(401, "INVALID_PASSWORD", "Invalid email or password"),
  invalidRole: (role: string) =>
    new AuthError(400, "INVALID_ROLE", `Role '${role}' is not allowed`),
  missingField: (field: string) =>
    new AuthError(400, "MISSING_FIELD", `Missing required field: ${field}`),
};
