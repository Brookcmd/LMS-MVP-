import { prisma } from "../lib/prisma";
import {
  hashPassword,
  comparePassword,
  signJWT,
  type JWTPayload,
} from "../lib/auth-utils";
import { authErrors } from "../lib/auth-errors";

export interface CreateAccountPayload {
  schoolId: string;
  name: string;
  email: string;
  role: "teacher" | "parent" | "student";
  password: string;
  studentId?: string | number;
}

export interface LoginPayload {
  schoolId?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    schoolId: string;
    name: string;
    email: string;
    role: "admin" | "teacher" | "parent" | "student";
    phone: string | null;
    createdAt: Date;
  };
  token: string;
}

/**
 * Create a new user account (teacher, parent, or student).
 * Hashes the password before storing.
 * Throws AuthError if email already exists in the school or role is invalid.
 */
export async function createAccount(
  payload: CreateAccountPayload,
): Promise<AuthResponse> {
  const { schoolId, name, email, role, password, studentId } = payload;
  const schoolIdNum = parseInt(schoolId, 10);

  // Validate role
  if (role !== "teacher" && role !== "parent" && role !== "student") {
    throw authErrors.invalidRole(role);
  }

  // Validate required fields
  if (!name || !email || !password) {
    throw authErrors.missingField(
      !name ? "name" : !email ? "email" : "password",
    );
  }

  // Check if email already exists in this school
  const existingUser = await prisma.user.findUnique({
    where: {
      email_schoolId: {
        email,
        schoolId: schoolIdNum,
      },
    },
  });

  if (existingUser) {
    throw authErrors.emailAlreadyExists(email);
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create the user
  const user = await prisma.user.create({
    data: {
      schoolId: schoolIdNum,
      name,
      email,
      role,
      passwordHash,
      phone: null,
    },
  });

  // If studentId provided, link User to Student
  if (role === "student" && studentId) {
    const sId = typeof studentId === "number" ? studentId : parseInt(studentId, 10);
    if (Number.isInteger(sId) && sId > 0) {
      await prisma.student.updateMany({
        where: { id: sId, schoolId: schoolIdNum },
        data: { userId: user.id },
      });
    }
  }

  // Generate JWT
  const token = signJWT({
    userId: String(user.id),
    role: user.role as "admin" | "teacher" | "parent" | "student",
    schoolId: String(user.schoolId),
  });

  return {
    user: {
      id: String(user.id),
      schoolId: String(user.schoolId),
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "teacher" | "parent" | "student",
      phone: user.phone,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Login with email and password.
 * Returns user and JWT if credentials are valid.
 * Throws AuthError if user not found or password is incorrect.
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { schoolId, password } = payload;
  const cleanEmail = payload.email?.trim();

  // Validate required fields
  if (!cleanEmail || !password) {
    throw authErrors.missingField(
      !cleanEmail ? "email" : "password",
    );
  }

  let user = null;
  if (schoolId) {
    const schoolIdNum = Number.parseInt(schoolId, 10);
    if (Number.isInteger(schoolIdNum) && schoolIdNum > 0) {
      user = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          schoolId: schoolIdNum,
        },
      });
    }
  }

  // Fallback: look up user by email directly if schoolId not specified or not matched
  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
    });
  }

  if (!user) {
    throw authErrors.userNotFound();
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw authErrors.invalidPassword();
  }

  // Generate JWT
  const token = signJWT({
    userId: String(user.id),
    role: user.role as "admin" | "teacher" | "parent" | "student",
    schoolId: String(user.schoolId),
  });

  return {
    user: {
      id: String(user.id),
      schoolId: String(user.schoolId),
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "teacher" | "parent" | "student",
      phone: user.phone,
      createdAt: user.createdAt,
    },
    token,
  };
}
