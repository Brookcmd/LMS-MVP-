import request from "supertest";
import app from "../app";
import { testData } from "./setup";

describe("Teacher attendance routes", () => {
  it("returns the class roster with existing attendance for a date", async () => {
    const response = await request(app)
      .get(`/attendance?classId=${testData.classId}&date=2026-07-10`)
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: testData.attendanceId,
            status: "absent",
            student: expect.objectContaining({
              id: testData.studentId,
              name: "Test Student",
            }),
          }),
        ]),
      }),
    );
  });

  it("returns unmarked roster rows when no attendance exists for the date", async () => {
    const response = await request(app)
      .get(`/attendance?classId=${testData.classId}&date=2026-07-11`)
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: [
          expect.objectContaining({
            id: null,
            status: null,
            student: expect.objectContaining({
              id: testData.studentId,
              name: "Test Student",
            }),
          }),
        ],
      }),
    );
  });
});
