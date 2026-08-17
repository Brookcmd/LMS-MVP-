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

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Support avatar uploads
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/classes", classesRouter);
app.use("/students", studentsRouter);
app.use("/teachers", teachersRouter);
app.use("/parents", parentsRouter);
app.use("/parent-students", parentStudentsRouter);
app.use("/attendance", attendanceRouter);
app.use("/parent", parentRouter);
app.use("/student", studentRouter);
app.use("/grades", gradesRouter);
app.use("/assessments", assessmentsRouter);
app.use("/schedule", scheduleRouter);
app.use("/messages", messagesRouter);
app.use("/notifications", notificationsRouter);
app.use("/contact", contactRouter);
app.use("/api/contact", contactRouter);
app.use(errorHandler);

export default app;
