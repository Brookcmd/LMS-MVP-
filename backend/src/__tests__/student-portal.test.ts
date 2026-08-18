import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { testData } from "./setup";

describe("Student Accounts & Portal Routes (/student, /students/:id/account)", () => {
  let studentToken: string;

  it("rejects unauthenticated requests to student overview", async () => {
    const res = await request(app).get("/student/overview");
    expect(res.status).toBe(401);
  });

  it("allows admin to provision a student login account", async () => {
    const res = await request(app)
      .post(`/students/${testData.student.id}/account`)
      .set("Authorization", `Bearer ${testData.adminToken}`)
      .send({
        email: "studentone@student.sheba.edu",
        password: "Student@123",
        name: "Student One",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("studentone@student.sheba.edu");
    expect(res.body.data.user.role).toBe("student");
  });

  it("forbids non-admin (parent or teacher) from provisioning student accounts", async () => {
    const res = await request(app)
      .post(`/students/${testData.student.id}/account`)
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .send({
        email: "hacked@student.sheba.edu",
        password: "Password@123",
      });

    expect(res.status).toBe(403);
  });

  it("authenticates the student using provisioned credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "studentone@student.sheba.edu",
        password: "Student@123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("student");
    expect(res.body.data.token).toBeDefined();

    studentToken = res.body.data.token;
  });

  it("allows authenticated student to fetch their portal overview", async () => {
    const res = await request(app)
      .get("/student/overview")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student).toBeDefined();
    expect(res.body.data.student.name).toBe("Student One");
    expect(res.body.data.schedule).toBeDefined();
    expect(res.body.data.assessments).toBeDefined();
    expect(res.body.data.attendance).toBeDefined();
    expect(res.body.data.attendance.stats).toBeDefined();
    expect(res.body.data.grades).toBeDefined();
  });

  it("allows student to fetch their profile", async () => {
    const res = await request(app)
      .get("/student/profile")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Student One");
    expect(res.body.data.class).toBeDefined();
  });

  it("forbids student from accessing admin endpoints", async () => {
    const res = await request(app)
      .get("/materials/admin")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it("includes linked user account in admin student list", async () => {
    const res = await request(app)
      .get(`/students/${testData.student.id}`)
      .set("Authorization", `Bearer ${testData.adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe("studentone@student.sheba.edu");
  });

  it("allows admin to deactivate a student login account", async () => {
    const res = await request(app)
      .delete(`/students/${testData.student.id}/account`)
      .set("Authorization", `Bearer ${testData.adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unlinked).toBe(true);
  });
});
