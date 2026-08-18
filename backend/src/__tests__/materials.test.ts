import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { testData } from "./setup";

describe("Course Materials Routes (/materials)", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/materials/teacher");
    expect(res.status).toBe(401);
  });

  it("allows teacher to list their course materials", async () => {
    const res = await request(app)
      .get("/materials/teacher")
      .set("Authorization", `Bearer ${testData.teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("allows listing materials for a class", async () => {
    const res = await request(app)
      .get(`/materials/class/${testData.class.id}`)
      .set("Authorization", `Bearer ${testData.parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("allows student/parent to list materials", async () => {
    const res = await request(app)
      .get(`/materials/student?studentId=${testData.student.id}`)
      .set("Authorization", `Bearer ${testData.parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("forbids parent from uploading materials", async () => {
    const res = await request(app)
      .post("/materials")
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .send({
        title: "Test Syllabus",
        classId: testData.class.id,
        subjectId: testData.subject.id,
      });

    expect(res.status).toBe(403);
  });

  it("allows admin to query school-wide materials repository", async () => {
    const res = await request(app)
      .get("/materials/admin?page=1&limit=10")
      .set("Authorization", `Bearer ${testData.adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(typeof res.body.data.total).toBe("number");
  });
});

