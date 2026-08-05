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


const app = express();

app.use(cors());
app.use(express.json());
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/classes", classesRouter);
app.use("/students", studentsRouter);
app.use("/teachers", teachersRouter);
app.use("/parents", parentsRouter);
app.use("/parent-students", parentStudentsRouter);
app.use("/attendance", attendanceRouter);
app.use("/parent", parentRouter);
app.use("/grades", gradesRouter);
app.use("/assessments", assessmentsRouter);
app.use("/schedule", scheduleRouter);
app.use(errorHandler);

export default app;
