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

studentsRouter.use(authMiddleware, roleMiddleware(["admin"]));

studentsRouter.get("/", listStudentsHandler);
studentsRouter.post("/", createStudentHandler);
studentsRouter.get("/:studentId", getStudentHandler);
studentsRouter.put("/:studentId", updateStudentHandler);
studentsRouter.delete("/:studentId", deleteStudentHandler);

export default studentsRouter;