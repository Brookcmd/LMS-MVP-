import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { getTeacherHandler, listTeachersHandler } from "../controllers/teacher-controller";

const teachersRouter = express.Router();

teachersRouter.use(authMiddleware, roleMiddleware(["admin"]));

teachersRouter.get("/", listTeachersHandler);
teachersRouter.get("/:teacherId", getTeacherHandler);

export default teachersRouter;