import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing message-service
vi.mock("../lib/prisma", () => ({
  prisma: {
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    classTeacher: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    teachingAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    parentStudent: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

import { prisma } from "../lib/prisma";
import { getEligibleRecipients } from "../services/message-service";

describe("getEligibleRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Parent role", () => {
    it("should return only teachers assigned to parent's child class with role and subject details", async () => {
      vi.mocked(prisma.parentStudent.findMany).mockResolvedValue([
        {
          parentUserId: 10,
          studentId: 101,
          student: {
            id: 101,
            name: "Dawit Abebe",
            classId: 5,
            class: {
              id: 5,
              name: "Grade 8A",
              homeroomTeacherId: 1,
              homeroomTeacher: {
                id: 1,
                name: "Mr. Kebede",
                email: "kebede@school.edu",
              },
              teachers: [
                {
                  teacher: {
                    id: 2,
                    name: "Mrs. Almaz",
                    email: "almaz@school.edu",
                  },
                },
              ],
              teachingAssignments: [
                {
                  teacher: {
                    id: 1,
                    name: "Mr. Kebede",
                    email: "kebede@school.edu",
                  },
                  subject: { id: 20, name: "Mathematics" },
                },
                {
                  teacher: {
                    id: 2,
                    name: "Mrs. Almaz",
                    email: "almaz@school.edu",
                  },
                  subject: { id: 21, name: "English" },
                },
              ],
            },
          },
        },
      ] as any);

      vi.mocked(prisma.conversation.findMany).mockResolvedValue([
        { id: 99, studentId: 101, teacherId: 1, parentId: 10 },
      ] as any);

      const recipients = await getEligibleRecipients(10, "parent", 1);

      expect(recipients).toHaveLength(2);

      const teacher1 = recipients.find((r) => r.teacherId === 1);
      expect(teacher1).toBeDefined();
      expect(teacher1?.teacherName).toBe("Mr. Kebede");
      expect(teacher1?.studentName).toBe("Dawit Abebe");
      expect(teacher1?.className).toBe("Grade 8A");
      expect(teacher1?.isHomeroom).toBe(true);
      expect(teacher1?.roleLabel).toContain("Homeroom Teacher");
      expect(teacher1?.roleLabel).toContain("Mathematics");
      expect(teacher1?.existingConversationId).toBe(99);

      const teacher2 = recipients.find((r) => r.teacherId === 2);
      expect(teacher2).toBeDefined();
      expect(teacher2?.teacherName).toBe("Mrs. Almaz");
      expect(teacher2?.roleLabel).toContain("English");
      expect(teacher2?.existingConversationId).toBeNull();
    });

    it("should return empty list if parent has no linked children", async () => {
      vi.mocked(prisma.parentStudent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      const recipients = await getEligibleRecipients(10, "parent", 1);
      expect(recipients).toEqual([]);
    });
  });

  describe("Teacher role", () => {
    it("should return only students in teacher's assigned classes with their linked parents", async () => {
      vi.mocked(prisma.classTeacher.findMany).mockResolvedValue([{ classId: 5 }] as any);
      vi.mocked(prisma.teachingAssignment.findMany).mockResolvedValue([{ classId: 6 }] as any);
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);

      vi.mocked(prisma.student.findMany).mockResolvedValue([
        {
          id: 101,
          name: "Dawit Abebe",
          class: { id: 5, name: "Grade 8A" },
          parents: [
            {
              parent: {
                id: 10,
                name: "Abebe Bikila",
                email: "abebe@example.com",
                phone: "+251911223344",
              },
              isPrimary: true,
              relationship: "Father",
            },
          ],
        },
        {
          id: 102,
          name: "Sara Tadesse",
          class: { id: 6, name: "Grade 8B" },
          parents: [], // Student without linked parent yet
        },
      ] as any);

      vi.mocked(prisma.conversation.findMany).mockResolvedValue([
        { id: 88, studentId: 101, teacherId: 1, parentId: 10 },
      ] as any);

      const students = await getEligibleRecipients(1, "teacher", 1);

      expect(students).toHaveLength(2);
      expect(students[0].studentName).toBe("Dawit Abebe");
      expect(students[0].parents).toHaveLength(1);
      expect(students[0].parents[0].parentName).toBe("Abebe Bikila");
      expect(students[0].parents[0].isPrimary).toBe(true);
      expect(students[0].parents[0].existingConversationId).toBe(88);

      expect(students[1].studentName).toBe("Sara Tadesse");
      expect(students[1].parents).toHaveLength(0); // Clear unlinked state
    });

    it("should return empty list if teacher has no assigned classes", async () => {
      vi.mocked(prisma.classTeacher.findMany).mockResolvedValue([]);
      vi.mocked(prisma.teachingAssignment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.class.findMany).mockResolvedValue([]);

      const result = await getEligibleRecipients(1, "teacher", 1);
      expect(result).toEqual([]);
    });
  });

  describe("Unauthorized role", () => {
    it("should reject roles other than parent or teacher", async () => {
      await expect(getEligibleRecipients(1, "student", 1)).rejects.toThrow(
        "Only teachers and parents can access recipients"
      );
    });
  });
});
