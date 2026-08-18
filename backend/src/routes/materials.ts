import express from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  deleteMaterialHandler,
  listAdminMaterialsHandler,
  listClassMaterialsHandler,
  listStudentMaterialsHandler,
  listTeacherMaterialsHandler,
  uploadMaterialHandler,
} from "../controllers/material-controller";

const materialsRouter = express.Router();

materialsRouter.use(authMiddleware);

// Admin school-wide material listing
materialsRouter.get("/admin", roleMiddleware(["admin"]), listAdminMaterialsHandler);

// Teacher/Admin upload course materials
materialsRouter.post("/", roleMiddleware(["teacher", "admin"]), uploadMaterialHandler);

// Teacher material listing
materialsRouter.get("/teacher", roleMiddleware(["teacher", "admin"]), listTeacherMaterialsHandler);

// Student/Parent materials for their enrolled classes
materialsRouter.get("/student", roleMiddleware(["student", "parent"]), listStudentMaterialsHandler);

// Class materials listing (any authenticated user with school access)
materialsRouter.get("/class/:classId", listClassMaterialsHandler);

// Delete course material
materialsRouter.delete("/:id", roleMiddleware(["teacher", "admin"]), deleteMaterialHandler);

export default materialsRouter;

