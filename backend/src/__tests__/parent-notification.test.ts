import request from "supertest";
import app from "../app";
import { testData } from "./setup";

describe("Parent notification routes", () => {
  it("returns notifications for an authenticated parent", async () => {
    const response = await request(app)
      .get("/parent/notifications")
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.any(Array),
      }),
    );

    const notification = response.body.data[0];
    expect(notification).toMatchObject({
      id: testData.notificationId,
      type: "absence",
    });
    expect(notification.student).toEqual(
      expect.objectContaining({
        id: testData.studentId,
      }),
    );
    expect(notification.attendance).toEqual(
      expect.objectContaining({
        id: testData.attendanceId,
      }),
    );
  });

  it("marks a parent notification as read", async () => {
    const response = await request(app)
      .patch(`/parent/notifications/${testData.notificationId}/read`)
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: testData.notificationId,
          readAt: expect.any(String),
        }),
      }),
    );

    expect(new Date(response.body.data.readAt).toString()).not.toBe("Invalid Date");
  });

  it("returns the same record when marking an already read notification as read again", async () => {
    const firstResponse = await request(app)
      .patch(`/parent/notifications/${testData.notificationId}/read`)
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .expect(200);

    const firstReadAt = firstResponse.body.data.readAt;

    const secondResponse = await request(app)
      .patch(`/parent/notifications/${testData.notificationId}/read`)
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .expect(200);

    expect(secondResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: testData.notificationId,
          readAt: firstReadAt,
        }),
      }),
    );
  });

  it("returns 403 when a non-parent role requests parent notifications", async () => {
    const response = await request(app)
      .get("/parent/notifications")
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .expect(403);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "FORBIDDEN_ROLE",
        }),
      }),
    );
  });

  it("returns 404 when marking a notification that does not belong to the parent", async () => {
    const response = await request(app)
      .patch(`/parent/notifications/999999/read`)
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "NOT_FOUND",
        }),
      }),
    );
  });

  it("returns 401 when the parent is unauthenticated", async () => {
    const response = await request(app)
      .get("/parent/notifications")
      .expect(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "MISSING_AUTH",
        }),
      }),
    );
  });
});
