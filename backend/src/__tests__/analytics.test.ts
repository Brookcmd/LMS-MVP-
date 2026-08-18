import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { testData } from "./setup";

describe("Admin Analytics Routes (/analytics)", () => {
  it("rejects unauthorized access without JWT", async () => {
    const response = await request(app).get("/analytics/admin");
    expect(response.status).toBe(401);
  });

  it("rejects access for non-admin users (e.g. teacher)", async () => {
    const response = await request(app)
      .get("/analytics/admin")
      .set("Authorization", `Bearer ${testData.teacherToken}`);

    expect(response.status).toBe(403);
  });

  it("returns institutional analytics for admin user", async () => {
    const response = await request(app)
      .get("/analytics/admin")
      .set("Authorization", `Bearer ${testData.adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("kpis");
    expect(response.body.data.kpis).toHaveProperty("totalStudents");
    expect(response.body.data.kpis).toHaveProperty("overallAttendanceRate");
    expect(response.body.data.kpis).toHaveProperty("overallGradeAverage");
    expect(response.body.data).toHaveProperty("attendance");
    expect(response.body.data).toHaveProperty("grades");
    expect(response.body.data).toHaveProperty("atRiskStudents");
  });

  it("accepts query filter parameters (classId, quarter)", async () => {
    const response = await request(app)
      .get(`/analytics/admin?classId=${testData.classId}&quarter=1`)
      .set("Authorization", `Bearer ${testData.adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.filtersApplied).toEqual({
      classId: testData.classId,
      quarter: 1,
      academicYear: null,
      gradeBand: null,
    });
    expect(response.body.data).toHaveProperty("gradeBandBreakdown");
  });

  it("accepts gradeBand query filter", async () => {
    const response = await request(app)
      .get("/analytics/admin?gradeBand=primary")
      .set("Authorization", `Bearer ${testData.adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.filtersApplied.gradeBand).toBe("primary");
  });
});
