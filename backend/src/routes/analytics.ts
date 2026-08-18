import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { getAdminAnalytics } from "../services/analytics-service";

const analyticsRouter = express.Router();

analyticsRouter.use(authMiddleware, roleMiddleware(["admin"]));

analyticsRouter.get("/admin", async (req: Request, res: Response, next) => {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      res.status(401).json({ success: false, error: { message: "Unauthorized" } });
      return;
    }

    const { classId, quarter, academicYear, gradeBand } = req.query;
    const analyticsData = await getAdminAnalytics(Number(schoolId), {
      classId: classId ? String(classId) : undefined,
      quarter: quarter ? String(quarter) : undefined,
      academicYear: academicYear ? String(academicYear) : undefined,
      gradeBand: gradeBand ? String(gradeBand) : undefined,
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
