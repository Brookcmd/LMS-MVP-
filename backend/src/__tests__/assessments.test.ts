import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing assessment-service
vi.mock("../lib/prisma", () => ({
  prisma: {
    teachingAssignment: {
      findFirst: vi.fn(),
    },
    classTeacher: {
      findFirst: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    assessment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    parentStudent: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma";
import {
  createAssessment,
  getTeacherAssessments,
  deleteAssessment,
  getParentAssessments,
} from "../services/assessment-service";

describe("assessment-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAssessment", () => {
    it("should throw an error if title is empty", async () => {
      await expect(
        createAssessment(1, 12, {
          title: "",
          classId: 1,
          subjectId: 1,
          dueDate: "2026-08-10T10:00:00Z",
        })
      ).rejects.toThrow("Title is required");
    });

    it("should throw an error if due date is invalid", async () => {
      await expect(
        createAssessment(1, 12, {
          title: "Physics Exam",
          classId: 1,
          subjectId: 1,
          dueDate: "invalid-date",
        })
      ).rejects.toThrow("Invalid due date format");
    });

    it("should create an assessment successfully when teacher is assigned", async () => {
      const mockTeachingAssignment = { id: 1, classId: 1, subjectId: 1, teacherId: 1 };
      const mockCreatedAssessment = {
        id: 10,
        title: "Physics Exam",
        type: "exam",
        dueDate: new Date("2026-08-10T10:00:00Z"),
        classId: 1,
        subjectId: 1,
        teacherId: 1,
        class: { id: 1, name: "Grade 10A" },
        subject: { id: 1, name: "Physics" },
        teacher: { id: 1, name: "Alemayehu Bekele" },
      };

      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockTeachingAssignment as any);
      vi.mocked(prisma.assessment.create).mockResolvedValue(mockCreatedAssessment as any);

      const result = await createAssessment(1, 12, {
        title: "Physics Exam",
        type: "exam",
        classId: 1,
        subjectId: 1,
        dueDate: "2026-08-10T10:00:00Z",
        description: "Chapter 1-4",
      });

      expect(result).toEqual(mockCreatedAssessment);
      expect(prisma.assessment.create).toHaveBeenCalled();
    });
  });

  describe("getTeacherAssessments", () => {
    it("should fetch teacher assessments ordered by due date", async () => {
      const mockAssessments = [
        { id: 1, title: "Quiz 1", dueDate: new Date("2026-08-08") },
      ];
      vi.mocked(prisma.assessment.findMany).mockResolvedValue(mockAssessments as any);

      const result = await getTeacherAssessments(1, 12);
      expect(result).toEqual(mockAssessments);
      expect(prisma.assessment.findMany).toHaveBeenCalledWith({
        where: { teacherId: 1, class: { schoolId: 12 } },
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
      });
    });
  });

  describe("deleteAssessment", () => {
    it("should throw notFound error if assessment does not exist", async () => {
      vi.mocked(prisma.assessment.findFirst).mockResolvedValue(null);

      await expect(deleteAssessment(99, 1, 12)).rejects.toThrow(
        "Assessment not found or you do not have permission to delete it"
      );
    });

    it("should delete existing assessment", async () => {
      vi.mocked(prisma.assessment.findFirst).mockResolvedValue({ id: 10 } as any);
      vi.mocked(prisma.assessment.delete).mockResolvedValue({ id: 10 } as any);

      const res = await deleteAssessment(10, 1, 12);
      expect(res.success).toBe(true);
      expect(prisma.assessment.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
  });

  describe("getParentAssessments", () => {
    it("should return empty array if parent has no linked children", async () => {
      vi.mocked(prisma.parentStudent.findMany).mockResolvedValue([]);

      const result = await getParentAssessments(5, 12);
      expect(result).toEqual([]);
    });

    it("should return parent assessments with calculated statuses", async () => {
      const mockLinks = [
        {
          parentUserId: 5,
          studentId: 100,
          student: {
            id: 100,
            name: "Abebe Kebede",
            classId: 1,
            class: { id: 1, name: "Grade 10A" },
          },
        },
      ];
      const futureDate = new Date(Date.now() + 86400000 * 3); // 3 days in future
      const mockAssessments = [
        {
          id: 1,
          title: "Math Homework",
          type: "assignment",
          dueDate: futureDate,
          classId: 1,
          subjectId: 2,
          class: { id: 1, name: "Grade 10A" },
          subject: { id: 2, name: "Math" },
          teacher: { id: 1, name: "Alemayehu" },
        },
      ];

      vi.mocked(prisma.parentStudent.findMany).mockResolvedValue(mockLinks as any);
      vi.mocked(prisma.assessment.findMany).mockResolvedValue(mockAssessments as any);

      const result = await getParentAssessments(5, 12, 100);
      expect(result.length).toBe(1);
      expect(result[0].status).toBe("upcoming");
      expect(result[0].students).toEqual([mockLinks[0].student]);
    });
  });
});
