import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";
import { assignmentForTeacher, id, year, quarter } from "./grade-service";

interface RowError {
  row: number;
  studentId: number | null;
  message: string;
}

interface UploadResult {
  saved: number;
  academicYear: string;
  quarter: number;
  errors?: RowError[];
}

/**
 * Generate a downloadable Excel template pre-filled with the class roster.
 * Score column is pre-filled with existing grades (if any) or left blank.
 */
export async function generateGradeTemplate(
  assignmentIdValue: string,
  teacherIdValue: string,
  schoolIdValue: string,
  academicYearValue: unknown,
  quarterValue: unknown,
): Promise<{ buffer: Buffer; filename: string }> {
  const assignment = await assignmentForTeacher(assignmentIdValue, teacherIdValue, schoolIdValue);
  const academicYear = year(academicYearValue);
  const q = quarter(quarterValue);

  // Fetch all students in the class
  const students = await prisma.student.findMany({
    where: { classId: assignment.classId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Fetch existing grades for this assignment/year/quarter
  const existingGrades = await prisma.grade.findMany({
    where: {
      teachingAssignmentId: assignment.id,
      academicYear,
      quarter: q,
    },
    select: { studentId: true, score: true },
  });

  const gradeMap = new Map(existingGrades.map((g) => [g.studentId, g.score]));

  // Build the workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Grades");

  // Header row
  worksheet.columns = [
    { header: "studentId", key: "studentId", width: 12 },
    { header: "studentName", key: "studentName", width: 30 },
    { header: "score", key: "score", width: 12 },
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };

  // Add student rows
  for (const student of students) {
    const existingScore = gradeMap.get(student.id);
    worksheet.addRow({
      studentId: student.id,
      studentName: student.name,
      score: existingScore ?? null,
    });
  }

  // Add data validation on the score column (integer 0–100)
  if (students.length > 0) {
    const lastDataRow = students.length + 1; // +1 for header
    for (let rowNum = 2; rowNum <= lastDataRow; rowNum++) {
      const cell = worksheet.getCell(`C${rowNum}`);
      cell.dataValidation = {
        type: "whole",
        operator: "between",
        formulae: [0, 100],
        showErrorMessage: true,
        errorTitle: "Invalid score",
        error: "Score must be a whole number from 0 to 100",
      };
    }
  }

  // Lock studentId and studentName columns to discourage editing
  worksheet.getColumn("A").eachCell((cell, rowNumber) => {
    if (rowNumber > 1) cell.protection = { locked: true };
  });
  worksheet.getColumn("B").eachCell((cell, rowNumber) => {
    if (rowNumber > 1) cell.protection = { locked: true };
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Build a descriptive filename
  const safeYear = academicYear.replace("/", "-");
  const filename = `grades-${assignment.class.name}-${assignment.subject.name}-${safeYear}-Q${q}.xlsx`
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  return { buffer, filename };
}

/**
 * Parse an uploaded Excel file, validate each row, and write grades atomically.
 * Returns { saved: N } on success, or { saved: 0, errors: [...] } on validation failure.
 */
export async function processGradeUpload(
  assignmentIdValue: string,
  teacherIdValue: string,
  schoolIdValue: string,
  academicYearValue: unknown,
  quarterValue: unknown,
  fileBuffer: Buffer,
): Promise<UploadResult> {
  const assignment = await assignmentForTeacher(assignmentIdValue, teacherIdValue, schoolIdValue);
  const academicYear = year(academicYearValue);
  const q = quarter(quarterValue);

  // Parse the Excel file
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer as unknown as ExcelJS.Buffer);
  } catch {
    throw appErrors.badRequest("Could not parse the uploaded file as a valid .xlsx workbook");
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw appErrors.badRequest("The uploaded workbook contains no worksheets");
  }

  // Collect parsed rows and errors
  const errors: RowError[] = [];
  const parsedRows: Array<{ studentId: number; score: number; spreadsheetRow: number }> = [];
  const seenStudentIds = new Map<number, number>(); // studentId → first spreadsheet row

  // Iterate data rows (row 1 is the header, data starts at row 2)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const rawStudentId = row.getCell(1).value;
    const rawScore = row.getCell(3).value;

    // Skip rows where score is blank (teacher left it empty intentionally)
    if (rawScore === null || rawScore === undefined || rawScore === "") {
      return;
    }

    // Validate studentId
    const studentIdNum = Number(rawStudentId);
    if (rawStudentId === null || rawStudentId === undefined || rawStudentId === "") {
      errors.push({ row: rowNumber, studentId: null, message: "Missing studentId" });
      return;
    }
    if (!Number.isInteger(studentIdNum) || studentIdNum <= 0) {
      errors.push({ row: rowNumber, studentId: null, message: `Invalid studentId: ${rawStudentId}` });
      return;
    }

    // Check for duplicate studentId within the file
    const previousRow = seenStudentIds.get(studentIdNum);
    if (previousRow !== undefined) {
      errors.push({ row: rowNumber, studentId: studentIdNum, message: `Duplicate studentId (first seen at row ${previousRow})` });
      return;
    }
    seenStudentIds.set(studentIdNum, rowNumber);

    // Validate score
    const scoreNum = Number(rawScore);
    if (!Number.isInteger(scoreNum)) {
      errors.push({ row: rowNumber, studentId: studentIdNum, message: `Score must be a whole number, got: ${rawScore}` });
      return;
    }
    if (scoreNum < 0 || scoreNum > 100) {
      errors.push({ row: rowNumber, studentId: studentIdNum, message: `Score must be between 0 and 100, got: ${scoreNum}` });
      return;
    }

    parsedRows.push({ studentId: studentIdNum, score: scoreNum, spreadsheetRow: rowNumber });
  });

  // Validate student IDs belong to this class for all parsed rows
  if (parsedRows.length > 0) {
    const studentIds = parsedRows.map((r) => r.studentId);
    const studentsInClass = await prisma.student.findMany({
      where: { id: { in: studentIds }, classId: assignment.classId },
      select: { id: true },
    });
    const validStudentIds = new Set(studentsInClass.map((s) => s.id));

    for (const row of parsedRows) {
      if (!validStudentIds.has(row.studentId)) {
        errors.push({ row: row.spreadsheetRow, studentId: row.studentId, message: "Student does not belong to this class" });
      }
    }
  }

  // If there are any errors (formatting, duplicate IDs, or invalid student IDs), return them sorted by row
  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    return { saved: 0, academicYear, quarter: q, errors };
  }

  // No data rows with scores and no errors
  if (parsedRows.length === 0) {
    throw appErrors.badRequest("No grade rows found in the uploaded file — every score cell is blank");
  }

  // All rows valid — write grades in a single transaction (atomic)
  await prisma.$transaction(
    parsedRows.map((row) =>
      prisma.grade.upsert({
        where: {
          studentId_teachingAssignmentId_academicYear_quarter: {
            studentId: row.studentId,
            teachingAssignmentId: assignment.id,
            academicYear,
            quarter: q,
          },
        },
        create: {
          studentId: row.studentId,
          teachingAssignmentId: assignment.id,
          academicYear,
          quarter: q,
          score: row.score,
        },
        update: { score: row.score },
      }),
    ),
  );

  return { saved: parsedRows.length, academicYear, quarter: q };
}
