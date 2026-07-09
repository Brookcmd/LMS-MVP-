import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface JWTPayload {
  userId: string;
  role: "admin" | "teacher" | "parent" | "student";
  schoolId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || "86400", 10); // 24 hours in seconds

/**
 * Sign a JWT with the given payload.
 * Expires in 24 hours.
 */
export function signJWT(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRY,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT.
 * Throws if the token is invalid or expired.
 */
export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plain-text password with a bcrypt hash.
 * Returns true if they match.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
