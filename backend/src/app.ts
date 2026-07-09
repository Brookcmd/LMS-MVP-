import express from "express";

import { errorHandler } from "./middleware/error-handler";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import classesRouter from "./routes/classes";
import studentsRouter from "./routes/students";
import teachersRouter from "./routes/teachers";
import parentStudentsRouter from "./routes/parent-students";
import attendanceRouter from "./routes/attendance";
import parentRouter from "./routes/parent";

const app = express();

app.use(express.json());
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/classes", classesRouter);
app.use("/students", studentsRouter);
app.use("/teachers", teachersRouter);
app.use("/parent-students", parentStudentsRouter);
app.use("/attendance", attendanceRouter);
app.use("/parent", parentRouter);
app.use(errorHandler);

export default app;
