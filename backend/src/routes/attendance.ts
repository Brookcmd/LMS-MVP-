import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  markAttendanceBatchHandler,
  getAttendanceByClassHandler,
} from "../controllers/attendance-controller";

const attendanceRouter = Router();

// All routes require auth and teacher role
attendanceRouter.use(authMiddleware);
attendanceRouter.use(roleMiddleware(["teacher"]));

// POST /attendance/batch - mark attendance for multiple students
attendanceRouter.post("/batch", markAttendanceBatchHandler);

// GET /attendance - get attendance records for a class and date
attendanceRouter.get("/", getAttendanceByClassHandler);

export default attendanceRouter;
