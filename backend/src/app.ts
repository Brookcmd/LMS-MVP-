import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/error-handler";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import classesRouter from "./routes/classes";
import studentsRouter from "./routes/students";
import teachersRouter from "./routes/teachers";
import parentsRouter from "./routes/parents";
import parentStudentsRouter from "./routes/parent-students";
import attendanceRouter from "./routes/attendance";
import parentRouter from "./routes/parent";
import gradesRouter from "./routes/grades";
import assessmentsRouter from "./routes/assessments";
import scheduleRouter from "./routes/schedule";
import messagesRouter from "./routes/messages";
import notificationsRouter from "./routes/notifications";
import studentRouter from "./routes/student";
import contactRouter from "./routes/contact";
import profileRouter from "./routes/profile";
import path from "path";
import analyticsRouter from "./routes/analytics";
import materialsRouter from "./routes/materials";
import submissionsRouter from "./routes/submissions";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Support avatar uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
const apiRoutes: Array<[string, express.Router]> = [
  ["/health", healthRouter],
  ["/auth", authRouter],
  ["/profile", profileRouter],
  ["/analytics", analyticsRouter],
  ["/materials", materialsRouter],
  ["/submissions", submissionsRouter],
  ["/classes", classesRouter],
  ["/students", studentsRouter],
  ["/teachers", teachersRouter],
  ["/parents", parentsRouter],
  ["/parent-students", parentStudentsRouter],
  ["/attendance", attendanceRouter],
  ["/parent", parentRouter],
  ["/student", studentRouter],
  ["/grades", gradesRouter],
  ["/assessments", assessmentsRouter],
  ["/schedule", scheduleRouter],
  ["/messages", messagesRouter],
  ["/notifications", notificationsRouter],
  ["/contact", contactRouter],
];

for (const [routePath, router] of apiRoutes) {
  app.use(routePath, router);
  app.use(`/api${routePath}`, router);
}
app.use(errorHandler);

export default app;
