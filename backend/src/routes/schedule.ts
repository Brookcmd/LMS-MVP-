import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  createSlotHandler,
  updateSlotHandler,
  deleteSlotHandler,
  getTeacherScheduleHandler,
  getParentScheduleHandler,
  getClassScheduleHandler,
} from "../controllers/schedule-controller";

const scheduleRouter = Router();

scheduleRouter.use(authMiddleware);

// Admin endpoints (create/update/delete schedule slots)
scheduleRouter.post("/", roleMiddleware(["admin"]), createSlotHandler);
scheduleRouter.put("/:id", roleMiddleware(["admin"]), updateSlotHandler);
scheduleRouter.delete("/:id", roleMiddleware(["admin"]), deleteSlotHandler);

// Read-only schedule endpoints
scheduleRouter.get("/teacher", roleMiddleware(["teacher"]), getTeacherScheduleHandler);
scheduleRouter.get("/parent", roleMiddleware(["parent"]), getParentScheduleHandler);
scheduleRouter.get("/class/:classId", roleMiddleware(["teacher", "admin"]), getClassScheduleHandler);

export default scheduleRouter;
