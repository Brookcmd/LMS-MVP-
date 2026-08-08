import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  createStudentHandler,
  deleteStudentHandler,
  getStudentHandler,
  listStudentsHandler,
  updateStudentHandler,
} from "../controllers/student-controller";

const studentsRouter = express.Router();

studentsRouter.use(authMiddleware);

studentsRouter.get("/", roleMiddleware(["admin", "teacher"]), listStudentsHandler);
studentsRouter.post("/", roleMiddleware(["admin"]), createStudentHandler);
studentsRouter.get("/:studentId", roleMiddleware(["admin", "teacher"]), getStudentHandler);
studentsRouter.put("/:studentId", roleMiddleware(["admin"]), updateStudentHandler);
studentsRouter.delete("/:studentId", roleMiddleware(["admin"]), deleteStudentHandler);

export default studentsRouter;