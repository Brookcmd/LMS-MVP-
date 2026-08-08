import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { listParentsHandler } from "../controllers/parent-user-controller";

const parentsRouter = express.Router();

parentsRouter.use(authMiddleware);

parentsRouter.get("/", roleMiddleware(["admin", "teacher"]), listParentsHandler);

export default parentsRouter;
