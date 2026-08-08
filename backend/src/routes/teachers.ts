import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { getTeacherHandler, listTeachersHandler } from "../controllers/teacher-controller";

const teachersRouter = express.Router();

teachersRouter.use(authMiddleware);

teachersRouter.get("/", roleMiddleware(["admin", "teacher", "parent"]), listTeachersHandler);
teachersRouter.get("/:teacherId", roleMiddleware(["admin"]), getTeacherHandler);

export default teachersRouter;