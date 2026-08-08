import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  listNotificationsHandler,
  markNotificationReadHandler,
} from "../controllers/notification-controller";

const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", listNotificationsHandler);
notificationsRouter.patch("/:id/read", markNotificationReadHandler);

export default notificationsRouter;
