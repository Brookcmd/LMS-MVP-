import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { createAssignmentHandler, createSubjectHandler, homeroomHandler, listAssignmentsHandler, listSubjectsHandler, mineHandler, parentHandler, rosterHandler, saveHandler } from "../controllers/grade-controller";

const gradesRouter = Router();
gradesRouter.use(authMiddleware);
gradesRouter.post("/subjects", roleMiddleware(["admin"]), createSubjectHandler);
gradesRouter.get("/subjects", roleMiddleware(["admin"]), listSubjectsHandler);
gradesRouter.post("/teaching-assignments", roleMiddleware(["admin"]), createAssignmentHandler);
gradesRouter.get("/teaching-assignments", roleMiddleware(["admin"]), listAssignmentsHandler);
gradesRouter.get("/teaching-assignments/mine", roleMiddleware(["teacher"]), mineHandler);
gradesRouter.get("/assignments/:assignmentId", roleMiddleware(["teacher"]), rosterHandler);
gradesRouter.put("/assignments/:assignmentId", roleMiddleware(["teacher"]), saveHandler);
gradesRouter.get("/classes/:classId/results", roleMiddleware(["teacher"]), homeroomHandler);
gradesRouter.get("/parent", roleMiddleware(["parent"]), parentHandler);
export default gradesRouter;
