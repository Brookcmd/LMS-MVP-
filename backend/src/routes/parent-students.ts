import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  deleteParentStudentLinkHandler,
  listParentStudentLinksHandler,
  upsertParentStudentLinkHandler,
} from "../controllers/parent-student-controller";

const parentStudentsRouter = express.Router();

parentStudentsRouter.use(authMiddleware, roleMiddleware(["admin"]));

parentStudentsRouter.get("/", listParentStudentLinksHandler);
parentStudentsRouter.post("/", upsertParentStudentLinkHandler);
parentStudentsRouter.delete("/:parentUserId/:studentId", deleteParentStudentLinkHandler);

export default parentStudentsRouter;