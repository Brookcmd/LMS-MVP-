import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export interface AnalyticsQueryOptions {
  classId?: string | number;
  quarter?: string | number;
  academicYear?: string;
}

export async function getAdminAnalytics(schoolIdNum: number, options: AnalyticsQueryOptions = {}) {
  const schoolId = Number(schoolIdNum);
  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    throw appErrors.badRequest("Invalid schoolId");
  }

  const filterClassId = options.classId ? Number(options.classId) : undefined;
  const filterQuarter = options.quarter ? Number(options.quarter) : undefined;
  const filterAcademicYear = options.academicYear ? String(options.academicYear).trim() : undefined;

  // 1. Executive Total Counts
  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    totalSubjects,
    totalAssessments,
    classesList,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId, ...(filterClassId ? { classId: filterClassId } : {}) } }),
    prisma.user.count({ where: { schoolId, role: "teacher" } }),
    prisma.user.count({ where: { schoolId, role: "parent" } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
    prisma.assessment.count({ where: { class: { schoolId }, ...(filterClassId ? { classId: filterClassId } : {}) } }),
    prisma.class.findMany({
      where: { schoolId, ...(filterClassId ? { id: filterClassId } : {}) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // 2. Attendance Analytics
  const attendanceWhere = {
    class: { schoolId },
    ...(filterClassId ? { classId: filterClassId } : {}),
  };

  const attendances = await prisma.attendance.findMany({
    where: attendanceWhere,
    select: {
      id: true,
      studentId: true,
      classId: true,
      date: true,
      status: true,
      class: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  const classAttendanceMap: Record<number, { classId: number; className: string; present: number; late: number; absent: number; total: number }> = {};
  const dailyAttendanceMap: Record<string, { date: string; present: number; late: number; absent: number; total: number }> = {};
  const studentAttendanceMap: Record<number, { total: number; present: number; late: number; absent: number }> = {};

  for (const att of attendances) {
    if (att.status === "present") presentCount++;
    else if (att.status === "late") lateCount++;
    else if (att.status === "absent") absentCount++;

    // Class map
    if (!classAttendanceMap[att.classId]) {
      classAttendanceMap[att.classId] = {
        classId: att.classId,
        className: att.class.name,
        present: 0,
        late: 0,
        absent: 0,
        total: 0,
      };
    }
    classAttendanceMap[att.classId][att.status]++;
    classAttendanceMap[att.classId].total++;

    // Daily trend map (YYYY-MM-DD)
    const dateStr = att.date.toISOString().split("T")[0];
    if (!dailyAttendanceMap[dateStr]) {
      dailyAttendanceMap[dateStr] = { date: dateStr, present: 0, late: 0, absent: 0, total: 0 };
    }
    dailyAttendanceMap[dateStr][att.status]++;
    dailyAttendanceMap[dateStr].total++;

    // Per-student map
    if (!studentAttendanceMap[att.studentId]) {
      studentAttendanceMap[att.studentId] = { total: 0, present: 0, late: 0, absent: 0 };
    }
    studentAttendanceMap[att.studentId][att.status]++;
    studentAttendanceMap[att.studentId].total++;
  }

  const totalAttendanceRecords = attendances.length;
  const overallAttendanceRate = totalAttendanceRecords > 0
    ? Math.round(((presentCount + lateCount) / totalAttendanceRecords) * 1000) / 10
    : 100;

  const classAttendanceRates = classesList.map((c) => {
    const data = classAttendanceMap[c.id] || { present: 0, late: 0, absent: 0, total: 0 };
    const rate = data.total > 0 ? Math.round(((data.present + data.late) / data.total) * 1000) / 10 : 100;
    return {
      classId: c.id,
      className: c.name,
      present: data.present,
      late: data.late,
      absent: data.absent,
      total: data.total,
      rate,
    };
  });

  const dailyTrends = Object.values(dailyAttendanceMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14); // Last 14 days of records

  // 3. Grade & Academic Performance Analytics
  const gradeWhere = {
    student: { schoolId, ...(filterClassId ? { classId: filterClassId } : {}) },
    ...(filterQuarter ? { quarter: filterQuarter } : {}),
    ...(filterAcademicYear ? { academicYear: filterAcademicYear } : {}),
  };

  const grades = await prisma.grade.findMany({
    where: gradeWhere,
    select: {
      id: true,
      studentId: true,
      score: true,
      academicYear: true,
      quarter: true,
      teachingAssignment: {
        select: {
          classId: true,
          class: { select: { name: true } },
          subjectId: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  let gradeSum = 0;
  const distribution = { bandA: 0, bandB: 0, bandC: 0, bandD: 0, bandF: 0 };
  const subjectGradeMap: Record<number, { subjectId: number; subjectName: string; scoreSum: number; count: number }> = {};
  const classGradeMap: Record<number, { classId: number; className: string; scoreSum: number; count: number }> = {};
  const studentGradeMap: Record<number, { scoreSum: number; count: number }> = {};

  for (const g of grades) {
    gradeSum += g.score;

    // Distribution bands
    if (g.score >= 90) distribution.bandA++;
    else if (g.score >= 80) distribution.bandB++;
    else if (g.score >= 70) distribution.bandC++;
    else if (g.score >= 60) distribution.bandD++;
    else distribution.bandF++;

    // Subject performance
    const subId = g.teachingAssignment.subjectId;
    if (!subjectGradeMap[subId]) {
      subjectGradeMap[subId] = {
        subjectId: subId,
        subjectName: g.teachingAssignment.subject.name,
        scoreSum: 0,
        count: 0,
      };
    }
    subjectGradeMap[subId].scoreSum += g.score;
    subjectGradeMap[subId].count++;

    // Class performance
    const clsId = g.teachingAssignment.classId;
    if (!classGradeMap[clsId]) {
      classGradeMap[clsId] = {
        classId: clsId,
        className: g.teachingAssignment.class.name,
        scoreSum: 0,
        count: 0,
      };
    }
    classGradeMap[clsId].scoreSum += g.score;
    classGradeMap[clsId].count++;

    // Student performance
    if (!studentGradeMap[g.studentId]) {
      studentGradeMap[g.studentId] = { scoreSum: 0, count: 0 };
    }
    studentGradeMap[g.studentId].scoreSum += g.score;
    studentGradeMap[g.studentId].count++;
  }

  const totalGrades = grades.length;
  const overallGradeAverage = totalGrades > 0
    ? Math.round((gradeSum / totalGrades) * 10) / 10
    : 0;

  const subjectPerformance = Object.values(subjectGradeMap).map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    averageScore: Math.round((s.scoreSum / s.count) * 10) / 10,
    studentCount: s.count,
  })).sort((a, b) => b.averageScore - a.averageScore);

  const classPerformance = classesList.map((c) => {
    const data = classGradeMap[c.id];
    return {
      classId: c.id,
      className: c.name,
      averageScore: data && data.count > 0 ? Math.round((data.scoreSum / data.count) * 10) / 10 : 0,
      gradedCount: data ? data.count : 0,
    };
  });

  // 4. At-Risk Student Identification
  const allStudents = await prisma.student.findMany({
    where: { schoolId, ...(filterClassId ? { classId: filterClassId } : {}) },
    select: {
      id: true,
      name: true,
      classId: true,
      class: { select: { name: true } },
      parents: {
        select: {
          parent: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const atRiskStudents: Array<{
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    attendanceRate: number | null;
    gradeAverage: number | null;
    riskFactors: string[];
    parents: Array<{ id: number; name: string; phone: string | null; email: string }>;
  }> = [];

  for (const s of allStudents) {
    const attData = studentAttendanceMap[s.id];
    const grData = studentGradeMap[s.id];

    let attRate: number | null = null;
    if (attData && attData.total > 0) {
      attRate = Math.round(((attData.present + attData.late) / attData.total) * 1000) / 10;
    }

    let grAvg: number | null = null;
    if (grData && grData.count > 0) {
      grAvg = Math.round((grData.scoreSum / grData.count) * 10) / 10;
    }

    const riskFactors: string[] = [];
    if (attRate !== null && attRate < 85) {
      riskFactors.push(`Low Attendance (${attRate}%)`);
    }
    if (grAvg !== null && grAvg < 60) {
      riskFactors.push(`Failing Average (${grAvg}%)`);
    }

    if (riskFactors.length > 0) {
      atRiskStudents.push({
        studentId: s.id,
        studentName: s.name,
        classId: s.classId,
        className: s.class.name,
        attendanceRate: attRate,
        gradeAverage: grAvg,
        riskFactors,
        parents: s.parents.map((p) => ({
          id: p.parent.id,
          name: p.parent.name,
          phone: p.parent.phone,
          email: p.parent.email,
        })),
      });
    }
  }

  return {
    kpis: {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      totalAssessments,
      overallAttendanceRate,
      overallGradeAverage,
      atRiskCount: atRiskStudents.length,
    },
    attendance: {
      totalRecords: totalAttendanceRecords,
      statusCounts: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
      },
      classRates: classAttendanceRates,
      dailyTrends,
    },
    grades: {
      totalGrades,
      overallAverage: overallGradeAverage,
      distribution,
      subjectPerformance,
      classPerformance,
    },
    atRiskStudents,
    filtersApplied: {
      classId: filterClassId ?? null,
      quarter: filterQuarter ?? null,
      academicYear: filterAcademicYear ?? null,
    },
  };
}
