import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { testData, prisma } from "./setup";

describe("Submissions Routes (/submissions)", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/submissions/assessment/1");
    expect(res.status).toBe(401);
  });

  it("forbids parent from viewing teacher submissions roster", async () => {
    const res = await request(app)
      .get("/submissions/assessment/1")
      .set("Authorization", `Bearer ${testData.parentToken}`);

    expect(res.status).toBe(403);
  });

  it("submits homework for a student and allows grading", async () => {
    // Create an assessment for testing
    const assessment = await prisma.assessment.create({
      data: {
        title: "Test Homework Submission",
        type: "assignment",
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        classId: testData.class.id,
        subjectId: testData.subject.id,
        teacherId: testData.teacherUser.id,
      },
    });

    // Parent submits work for student
    const submitRes = await request(app)
      .post(`/submissions/assessment/${assessment.id}`)
      .set("Authorization", `Bearer ${testData.parentToken}`)
      .field("studentId", testData.student.id)
      .field("content", "Here is my completed essay.");

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.content).toBe("Here is my completed essay.");
    expect(submitRes.body.data.status).toBe("submitted");

    const submissionId = submitRes.body.data.id;

    // Parent fetches their submission
    const getRes = await request(app)
      .get(`/submissions/assessment/${assessment.id}/my?studentId=${testData.student.id}`)
      .set("Authorization", `Bearer ${testData.parentToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(submissionId);

    // Teacher views roster for assessment
    const rosterRes = await request(app)
      .get(`/submissions/assessment/${assessment.id}`)
      .set("Authorization", `Bearer ${testData.teacherToken}`);

    expect(rosterRes.status).toBe(200);
    expect(rosterRes.body.data.assessment.submittedCount).toBe(1);

    // Teacher grades submission
    const gradeRes = await request(app)
      .patch(`/submissions/${submissionId}/grade`)
      .set("Authorization", `Bearer ${testData.teacherToken}`)
      .send({
        gradeScore: 98,
        feedback: "Outstanding analysis and structure.",
      });

    expect(gradeRes.status).toBe(200);
    expect(gradeRes.body.data.gradeScore).toBe(98);
    expect(gradeRes.body.data.feedback).toBe("Outstanding analysis and structure.");
    expect(gradeRes.body.data.status).toBe("graded");
  });
});
