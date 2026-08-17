import express, { Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { getAdminAnalytics } from "../services/analytics-service";

const analyticsRouter = express.Router();

analyticsRouter.use(authMiddleware, roleMiddleware(["admin"]));

analyticsRouter.get("/admin", async (req: AuthRequest, res: Response, next) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized" } });
      return;
    }

    const { classId, quarter, academicYear } = req.query;
    const analyticsData = await getAdminAnalytics(schoolId, {
      classId: classId ? String(classId) : undefined,
      quarter: quarter ? String(quarter) : undefined,
      academicYear: academicYear ? String(academicYear) : undefined,
    });

    res.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    next(error);
  }
});

export default analyticsRouter;
