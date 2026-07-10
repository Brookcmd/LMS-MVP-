import express from "express";
import { getChildAttendanceHistoryHandler } from "../controllers/parent-attendance-controller";
import {
  listParentNotificationsHandler,
  markParentNotificationReadHandler,
} from "../controllers/parent-notification-controller";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";

const parentRouter = express.Router();

parentRouter.use(authMiddleware, roleMiddleware(["parent"]));

parentRouter.get("/attendance", getChildAttendanceHistoryHandler);
parentRouter.get("/notifications", listParentNotificationsHandler);
parentRouter.patch(
  "/notifications/:notificationId/read",
  markParentNotificationReadHandler,
);

export default parentRouter;
