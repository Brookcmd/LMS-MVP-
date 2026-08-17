import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { comparePassword, hashPassword } from "../lib/auth-utils";

const profileRouter = express.Router();

// All routes require valid JWT session
profileRouter.use(authMiddleware);

/**
 * Helper to extract current user ID from JWT
 */
function getUserId(req: Request): number | null {
  if (!req.user) return null;
  const idStr = req.user.userId || (req.user as any).id;
  const idNum = Number(idStr);
  return Number.isNaN(idNum) ? null : idNum;
}

/**
 * GET /profile/me
 * Fetch the current authenticated user profile
 */
profileRouter.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        schoolId: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        id: String(user.id),
        schoolId: String(user.schoolId),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error?.message ?? "Failed to fetch profile", code: "SERVER_ERROR" } });
  }
});

/**
 * PUT /profile/me
 * Update personal profile details: name, phone, avatarUrl
 */
profileRouter.put("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const { name, phone, avatarUrl } = req.body;

    const dataToUpdate: any = {};
    if (typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (phone !== undefined) {
      dataToUpdate.phone = typeof phone === "string" ? phone.trim() : null;
    }
    if (avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = typeof avatarUrl === "string" ? avatarUrl : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        schoolId: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...updatedUser,
        id: String(updatedUser.id),
        schoolId: String(updatedUser.schoolId),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error?.message ?? "Failed to update profile", code: "SERVER_ERROR" } });
  }
});

/**
 * POST /profile/change-password
 * Change password after validating the current password
 */
profileRouter.post("/change-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: { message: "Current password and new password are required", code: "MISSING_FIELDS" },
      });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { message: "New password must be at least 6 characters long", code: "WEAK_PASSWORD" },
      });
      return;
    }

    // Look up the user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: { message: "The current password provided is incorrect", code: "INVALID_CURRENT_PASSWORD" },
      });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    res.status(200).json({
      success: true,
      data: { message: "Password updated successfully" },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error?.message ?? "Failed to change password", code: "SERVER_ERROR" } });
  }
});

export default profileRouter;
