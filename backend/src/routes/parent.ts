import express from "express";
import { getChildAttendanceHistoryHandler } from "../controllers/parent-attendance-controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const parentRouter = express.Router();

parentRouter.use(authMiddleware, roleMiddleware(["parent"]));

parentRouter.get("/attendance", getChildAttendanceHistoryHandler);

export default parentRouter;
