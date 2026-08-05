import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  createAssessmentHandler,
  deleteAssessmentHandler,
  getParentAssessmentsHandler,
  getTeacherAssessmentsHandler,
} from "../controllers/assessment-controller";

const assessmentsRouter = Router();

assessmentsRouter.use(authMiddleware);

// Teacher endpoints
assessmentsRouter.post("/", roleMiddleware(["teacher"]), createAssessmentHandler);
assessmentsRouter.get("/teacher", roleMiddleware(["teacher"]), getTeacherAssessmentsHandler);
assessmentsRouter.delete("/:id", roleMiddleware(["teacher"]), deleteAssessmentHandler);

// Parent endpoint
assessmentsRouter.get("/parent", roleMiddleware(["parent"]), getParentAssessmentsHandler);

export default assessmentsRouter;
