import dotenv from "dotenv";
import path from "path";

import { defineConfig, env } from "prisma/config";

dotenv.config({ path: path.resolve("backend", ".env") });

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});