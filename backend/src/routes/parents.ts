import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { listParentsHandler } from "../controllers/parent-user-controller";

const parentsRouter = express.Router();

parentsRouter.use(authMiddleware, roleMiddleware(["admin"]));

parentsRouter.get("/", listParentsHandler);

export default parentsRouter;
