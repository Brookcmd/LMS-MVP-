import { describe, it, expect, vi, beforeEach } from "vitest";
import ExcelJS from "exceljs";

// Mock prisma before importing services
vi.mock("../lib/prisma", () => ({
  prisma: {
    teachingAssignment: {
      findFirst: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    grade: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../lib/prisma";
import { generateGradeTemplate, processGradeUpload } from "../services/grade-upload-service";

describe("grade-upload-service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockAssignment = {
    id: 10,
    classId: 1,
    teacherId: 5,
    subjectId: 2,
    class: { id: 1, name: "Grade 10A", schoolId: 100, homeroomTeacherId: null },
    subject: { id: 2, name: "Mathematics", schoolId: 100 },
    teacher: { id: 5, name: "Teacher Bob" },
  };

  const mockStudents = [
    { id: 101, name: "Alice Smith" },
    { id: 102, name: "Bob Jones" },
  ];

  describe("generateGradeTemplate", () => {
    it("throws 403 if teacher does not own assignment", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(null);

      await expect(
        generateGradeTemplate("10", "5", "100", "2026/27", "1")
      ).rejects.toThrow("You are not assigned to this subject and class");
    });

    it("generates Excel template buffer with pre-filled students and existing scores", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockAssignment as any);
      vi.mocked(prisma.student.findMany).mockResolvedValue(mockStudents as any);
      vi.mocked(prisma.grade.findMany).mockResolvedValue([
        { studentId: 101, score: 88 },
      ] as any);

      const result = await generateGradeTemplate("10", "5", "100", "2026/27", "1");

      expect(result.filename).toBe("grades-Grade-10A-Mathematics-2026-27-Q1.xlsx");
      expect(result.buffer).toBeInstanceOf(Buffer);

      // Verify workbook content using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(result.buffer as unknown as ExcelJS.Buffer);
      const sheet = workbook.worksheets[0];
      expect(sheet.rowCount).toBe(3); // 1 header + 2 students

      expect(sheet.getRow(1).getCell(1).value).toBe("studentId");
      expect(sheet.getRow(1).getCell(2).value).toBe("studentName");
      expect(sheet.getRow(1).getCell(3).value).toBe("score");

      expect(sheet.getRow(2).getCell(1).value).toBe(101);
      expect(sheet.getRow(2).getCell(2).value).toBe("Alice Smith");
      expect(sheet.getRow(2).getCell(3).value).toBe(88);

      expect(sheet.getRow(3).getCell(1).value).toBe(102);
      expect(sheet.getRow(3).getCell(2).value).toBe("Bob Jones");
      expect(sheet.getRow(3).getCell(3).value).toBeNull();
    });
  });

  describe("processGradeUpload", () => {
    async function createTestBuffer(
      rows: Array<{ studentId: any; studentName: string; score: any }>
    ): Promise<Buffer> {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Grades");
      sheet.columns = [
        { header: "studentId", key: "studentId" },
        { header: "studentName", key: "studentName" },
        { header: "score", key: "score" },
      ];
      for (const row of rows) {
        sheet.addRow(row);
      }
      const arr = await workbook.xlsx.writeBuffer();
      return Buffer.from(arr);
    }

    it("throws 403 if teacher does not own assignment", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(null);
      const buffer = await createTestBuffer([{ studentId: 101, studentName: "Alice", score: 90 }]);

      await expect(
        processGradeUpload("10", "5", "100", "2026/27", "1", buffer)
      ).rejects.toThrow("You are not assigned to this subject and class");
    });

    it("successfully processes valid upload and executes transaction", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockAssignment as any);
      vi.mocked(prisma.student.findMany).mockResolvedValue([
        { id: 101 },
        { id: 102 },
      ] as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const buffer = await createTestBuffer([
        { studentId: 101, studentName: "Alice", score: 95 },
        { studentId: 102, studentName: "Bob", score: 85 },
      ]);

      const result = await processGradeUpload("10", "5", "100", "2026/27", "1", buffer);

      expect(result.saved).toBe(2);
      expect(result.academicYear).toBe("2026/27");
      expect(result.quarter).toBe(1);
      expect(result.errors).toBeUndefined();
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it("reports row-level errors for invalid scores and unknown students without writing grades", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockAssignment as any);
      // Student 101 belongs to class, 999 does not
      vi.mocked(prisma.student.findMany).mockResolvedValue([{ id: 101 }] as any);

      const buffer = await createTestBuffer([
        { studentId: 101, studentName: "Alice", score: 150 }, // Row 2: invalid score
        { studentId: 999, studentName: "Stranger", score: 70 }, // Row 3: student not in class
      ]);

      const result = await processGradeUpload("10", "5", "100", "2026/27", "1", buffer);

      expect(result.saved).toBe(0);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(2);
      expect(result.errors?.[0]).toEqual({
        row: 2,
        studentId: 101,
        message: "Score must be between 0 and 100, got: 150",
      });
      expect(result.errors?.[1]).toEqual({
        row: 3,
        studentId: 999,
        message: "Student does not belong to this class",
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("reports duplicate studentId within the file", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockAssignment as any);
      vi.mocked(prisma.student.findMany).mockResolvedValue([{ id: 101 }] as any);

      const buffer = await createTestBuffer([
        { studentId: 101, studentName: "Alice", score: 80 }, // Row 2
        { studentId: 101, studentName: "Alice Duplicate", score: 90 }, // Row 3
      ]);

      const result = await processGradeUpload("10", "5", "100", "2026/27", "1", buffer);

      expect(result.saved).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]).toEqual({
        row: 3,
        studentId: 101,
        message: "Duplicate studentId (first seen at row 2)",
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("skips blank score rows and saves remaining valid rows", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockAssignment as any);
      vi.mocked(prisma.student.findMany).mockResolvedValue([{ id: 101 }] as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}] as any);

      const buffer = await createTestBuffer([
        { studentId: 101, studentName: "Alice", score: 92 },
        { studentId: 102, studentName: "Bob", score: null }, // Blank score row skipped
      ]);

      const result = await processGradeUpload("10", "5", "100", "2026/27", "1", buffer);

      expect(result.saved).toBe(1);
      expect(result.errors).toBeUndefined();
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it("throws badRequest if uploaded buffer is not a valid excel file", async () => {
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(mockAssignment as any);
      const invalidBuffer = Buffer.from("not an excel file");

      await expect(
        processGradeUpload("10", "5", "100", "2026/27", "1", invalidBuffer)
      ).rejects.toThrow("Could not parse the uploaded file as a valid .xlsx workbook");
    });
  });
});
