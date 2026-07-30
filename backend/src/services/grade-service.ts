import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

const includeAssignment = {
  class: { select: { id: true, name: true, schoolId: true, homeroomTeacherId: true } },
  subject: { select: { id: true, name: true, schoolId: true } },
  teacher: { select: { id: true, name: true } },
} as const;

function id(value: unknown, name: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw appErrors.badRequest(`Invalid ${name}`); return parsed; }
function year(value: unknown) { const result = typeof value === "string" ? value.trim() : ""; if (!/^\d{4}\/\d{2}$/.test(result)) throw appErrors.badRequest("academicYear must use YYYY/YY format"); return result; }
function quarter(value: unknown) { const result = Number(value); if (!Number.isInteger(result) || result < 1 || result > 4) throw appErrors.badRequest("quarter must be between 1 and 4"); return result; }

export async function createSubject(schoolIdValue: string, nameValue: unknown) {
  const schoolId = id(schoolIdValue, "schoolId"); const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (!name) throw appErrors.badRequest("name is required");
  try { return await prisma.subject.create({ data: { schoolId, name } }); } catch { throw appErrors.conflict("A subject with this name already exists"); }
}
export async function listSubjects(schoolIdValue: string) { return prisma.subject.findMany({ where: { schoolId: id(schoolIdValue, "schoolId") }, orderBy: { name: "asc" } }); }

export async function createTeachingAssignment(schoolIdValue: string, payload: Record<string, unknown>) {
  const schoolId = id(schoolIdValue, "schoolId"); const classId = id(payload.classId, "classId"); const teacherId = id(payload.teacherId, "teacherId"); const subjectId = id(payload.subjectId, "subjectId");
  const [schoolClass, teacher, subject] = await Promise.all([
    prisma.class.findFirst({ where: { id: classId, schoolId } }), prisma.user.findFirst({ where: { id: teacherId, schoolId, role: "teacher" } }), prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
  ]);
  if (!schoolClass || !teacher || !subject) throw appErrors.badRequest("classId, teacherId, or subjectId is invalid");
  try { return await prisma.teachingAssignment.create({ data: { classId, teacherId, subjectId }, include: includeAssignment }); } catch { throw appErrors.conflict("This teaching assignment already exists"); }
}
export async function teacherAssignments(teacherIdValue: string, schoolIdValue: string) { return prisma.teachingAssignment.findMany({ where: { teacherId: id(teacherIdValue, "teacherId"), class: { schoolId: id(schoolIdValue, "schoolId") } }, include: includeAssignment, orderBy: { subject: { name: "asc" } } }); }
export async function listTeachingAssignments(schoolIdValue: string) { return prisma.teachingAssignment.findMany({ where: { class: { schoolId: id(schoolIdValue, "schoolId") } }, include: includeAssignment, orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }] }); }

async function assignmentForTeacher(assignmentIdValue: string, teacherIdValue: string, schoolIdValue: string) {
  const assignment = await prisma.teachingAssignment.findFirst({ where: { id: id(assignmentIdValue, "assignmentId"), teacherId: id(teacherIdValue, "teacherId"), class: { schoolId: id(schoolIdValue, "schoolId") } }, include: includeAssignment });
  if (!assignment) throw appErrors.forbidden("You are not assigned to this subject and class"); return assignment;
}
export async function assignmentRoster(assignmentId: string, teacherId: string, schoolId: string, academicYear: unknown, quarterValue: unknown) {
  const assignment = await assignmentForTeacher(assignmentId, teacherId, schoolId); const academic = year(academicYear); const q = quarter(quarterValue);
  const students = await prisma.student.findMany({ where: { classId: assignment.classId }, orderBy: { name: "asc" }, include: { grades: { where: { teachingAssignmentId: assignment.id, academicYear: academic, quarter: q }, select: { id: true, score: true, updatedAt: true } } } });
  return { assignment, academicYear: academic, quarter: q, students: students.map((student) => ({ id: student.id, name: student.name, grade: student.grades[0] ?? null })) };
}
export async function saveAssignmentGrades(assignmentId: string, teacherId: string, schoolId: string, payload: Record<string, unknown>) {
  const assignment = await assignmentForTeacher(assignmentId, teacherId, schoolId); const academicYear = year(payload.academicYear); const q = quarter(payload.quarter);
  if (!Array.isArray(payload.grades) || payload.grades.length === 0) throw appErrors.badRequest("grades must be a nonempty array");
  const rows = payload.grades.map((entry) => { const value = entry as Record<string, unknown>; const studentId = id(value.studentId, "studentId"); const score = Number(value.score); if (!Number.isInteger(score) || score < 0 || score > 100) throw appErrors.badRequest("score must be an integer from 0 to 100"); return { studentId, score }; });
  if (new Set(rows.map((row) => row.studentId)).size !== rows.length) throw appErrors.badRequest("Duplicate student IDs in grades");
  const found = await prisma.student.count({ where: { id: { in: rows.map((row) => row.studentId) }, classId: assignment.classId } }); if (found !== rows.length) throw appErrors.badRequest("One or more students do not belong to this class");
  await prisma.$transaction(rows.map((row) => prisma.grade.upsert({ where: { studentId_teachingAssignmentId_academicYear_quarter: { studentId: row.studentId, teachingAssignmentId: assignment.id, academicYear, quarter: q } }, create: { ...row, teachingAssignmentId: assignment.id, academicYear, quarter: q }, update: { score: row.score } })));
  return { saved: rows.length, academicYear, quarter: q };
}

async function classResults(classIdValue: string, schoolIdValue: string, academicYearValue: unknown, quarterValue: unknown) {
  const classId = id(classIdValue, "classId"); const schoolId = id(schoolIdValue, "schoolId"); const academicYear = year(academicYearValue); const q = quarter(quarterValue);
  const schoolClass = await prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true, name: true } }); if (!schoolClass) throw appErrors.notFound("Class not found");
  const students = await prisma.student.findMany({ where: { classId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const grades = await prisma.grade.findMany({ where: { academicYear, quarter: q, student: { classId }, teachingAssignment: { classId } }, select: { studentId: true, score: true, teachingAssignment: { select: { subject: { select: { id: true, name: true } } } } } });
  const rows = students.map((student) => { const subjectScores = grades.filter((grade) => grade.studentId === student.id).map((grade) => ({ subject: grade.teachingAssignment.subject, score: grade.score })); const average = subjectScores.length ? subjectScores.reduce((sum, grade) => sum + grade.score, 0) / subjectScores.length : null; return { student, subjectScores, average, rank: null as number | null }; });
  const ranked = rows.filter((row) => row.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0)); let rank = 0; let previous: number | null = null; ranked.forEach((row, index) => { if (row.average !== previous) rank = index + 1; row.rank = rank; previous = row.average; });
  return { class: schoolClass, academicYear, quarter: q, results: rows };
}
export async function homeroomResults(classId: string, teacherIdValue: string, schoolId: string, academicYear: unknown, q: unknown) { const teacherId = id(teacherIdValue, "teacherId"); const schoolClass = await prisma.class.findFirst({ where: { id: id(classId, "classId"), schoolId: id(schoolId, "schoolId"), homeroomTeacherId: teacherId } }); if (!schoolClass) throw appErrors.forbidden("You are not the homeroom teacher for this class"); return classResults(classId, schoolId, academicYear, q); }
export async function parentGrades(parentUserIdValue: string, schoolId: string, studentIdValue: unknown, academicYear: unknown, q: unknown) { const studentId = id(studentIdValue, "studentId"); const parentUserId = id(parentUserIdValue, "parentUserId"); const link = await prisma.parentStudent.findFirst({ where: { parentUserId, studentId, student: { schoolId: id(schoolId, "schoolId") } }, select: { student: { select: { classId: true } } } }); if (!link) throw appErrors.notFound("Child not found"); const report = await classResults(String(link.student.classId), schoolId, academicYear, q); return { ...report, result: report.results.find((row) => row.student.id === studentId) }; }
