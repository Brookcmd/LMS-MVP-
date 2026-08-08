import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  listConversationsHandler,
  createConversationHandler,
  getConversationDetailsHandler,
  sendMessageHandler,
  markConversationReadHandler,
} from "../controllers/message-controller";

const messagesRouter = Router();

messagesRouter.use(authMiddleware);
messagesRouter.use(roleMiddleware(["teacher", "parent"]));

messagesRouter.get("/conversations", listConversationsHandler);
messagesRouter.post("/conversations", createConversationHandler);
messagesRouter.get("/conversations/:id", getConversationDetailsHandler);
messagesRouter.post("/conversations/:id/messages", sendMessageHandler);
messagesRouter.patch("/conversations/:id/read", markConversationReadHandler);

export default messagesRouter;
