import express from "express";
import { getStudentAttendanceHistoryHandler } from "../controllers/parent-attendance-controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { prisma } from "../lib/prisma";
import { AppError, appErrors } from "../lib/app-error";

const studentRouter = express.Router();

studentRouter.use(authMiddleware, roleMiddleware(["student"]));

studentRouter.get("/attendance", getStudentAttendanceHistoryHandler);

studentRouter.get("/profile", async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({
      where: {
        userId: Number(req.user!.userId),
        schoolId: Number(req.user!.schoolId),
      },
      include: {
        class: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!student) {
      throw appErrors.notFound("Student record not found");
    }

    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

export default studentRouter;
