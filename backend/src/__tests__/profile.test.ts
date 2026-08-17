import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { testData } from "./setup";

describe("User Profile Routes (/profile)", () => {
  it("rejects unauthorized access without JWT", async () => {
    const response = await request(app).get("/profile/me");
    expect(response.status).toBe(401);
  });

  it("returns the profile for the authenticated user", async () => {
    const response = await request(app)
      .get("/profile/me")
      .set("Authorization", `Bearer ${testData.teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: String(testData.teacherUserId),
      role: "teacher",
      email: "teacher@test.com",
    });
  });

  it("updates personal details (name, phone, avatarUrl)", async () => {
    const response = await request(app)
      .put("/profile/me")
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .send({
        name: "Dr. Updated Teacher",
        phone: "+251911223344",
        avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Dr. Updated Teacher");
    expect(response.body.data.phone).toBe("+251911223344");
    expect(response.body.data.avatarUrl).toContain("data:image/png;base64");
  });

  it("rejects password change if current password is wrong", async () => {
    const response = await request(app)
      .post("/profile/change-password")
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .send({
        currentPassword: "WrongPassword999",
        newPassword: "NewSecretPassword@123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_CURRENT_PASSWORD");
  });

  it("rejects password change if new password is too short", async () => {
    const response = await request(app)
      .post("/profile/change-password")
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .send({
        currentPassword: "Test@123",
        newPassword: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("WEAK_PASSWORD");
  });

  it("changes password successfully when current password matches", async () => {
    const response = await request(app)
      .post("/profile/change-password")
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .send({
        currentPassword: "Test@123",
        newPassword: "NewSecretPassword@123",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify user can now log in with the new password
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        schoolId: String(testData.schoolId),
        email: "teacher@test.com",
        password: "NewSecretPassword@123",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });
});
