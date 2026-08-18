import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  getStudentSubmissionHandler,
  gradeSubmissionHandler,
  listAssessmentSubmissionsHandler,
  submitAssignmentHandler,
} from "../controllers/submission-controller";

const submissionsRouter = express.Router();

submissionsRouter.use(authMiddleware);

// Student/Parent submit or update homework
submissionsRouter.post(
  "/assessment/:assessmentId",
  roleMiddleware(["student", "parent"]),
  submitAssignmentHandler
);

// View current student submission
submissionsRouter.get(
  "/assessment/:assessmentId/my",
  getStudentSubmissionHandler
);

// Teacher/Admin view all class submissions & roster for an assessment
submissionsRouter.get(
  "/assessment/:assessmentId",
  roleMiddleware(["teacher", "admin"]),
  listAssessmentSubmissionsHandler
);

// Teacher/Admin grade submission
submissionsRouter.patch(
  "/:submissionId/grade",
  roleMiddleware(["teacher", "admin"]),
  gradeSubmissionHandler
);

export default submissionsRouter;
