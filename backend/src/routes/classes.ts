import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  createClassHandler,
  deleteClassHandler,
  getClassHandler,
  listClassesHandler,
  updateClassHandler,
} from "../controllers/class-controller";

const classesRouter = express.Router();

classesRouter.use(authMiddleware, roleMiddleware(["admin"]));

classesRouter.get("/", listClassesHandler);
classesRouter.post("/", createClassHandler);
classesRouter.get("/:classId", getClassHandler);
classesRouter.put("/:classId", updateClassHandler);
classesRouter.delete("/:classId", deleteClassHandler);

export default classesRouter;