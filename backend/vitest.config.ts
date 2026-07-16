import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "./backend",
  test: {
    include: ["src/**/*.test.ts"],
    globals: true,
    environment: "node",
    setupFiles: ["src/__tests__/setup.ts"],
    testTimeout: 15000,
  },
});