import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

export async function getStudentOverview(userIdValue: string | number, schoolIdValue: string | number) {
  const userId = Number(userIdValue);
  const schoolId = Number(schoolIdValue);

  if (!Number.isInteger(userId) || !Number.isInteger(schoolId)) {
    throw appErrors.badRequest("Invalid user ID or school ID");
  }

  // 1. Find linked student record
  const student = await prisma.student.findFirst({
    where: {
      userId,
      schoolId,
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          homeroomTeacher: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      school: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      parents: {
        include: {
          parent: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
    },
  });

  if (!student) {
    throw appErrors.notFound("No student profile is linked to this user account");
  }

  const classId = student.classId;

  // 2. Fetch Schedule Slots for the student's class
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayName = days[new Date().getDay()]; // e.g. "tuesday"

  const scheduleSlots = await prisma.scheduleSlot.findMany({
    where: { classId },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
  });

  const todaySlots = scheduleSlots.filter(
    (slot) => slot.dayOfWeek.toLowerCase() === currentDayName
  );

  // 3. Fetch Assessments and student submissions for this class
  const assessments = await prisma.assessment.findMany({
    where: { classId },
    orderBy: { dueDate: "asc" },
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      submissions: {
        where: { studentId: student.id },
      },
    },
  });

  const mappedAssessments = assessments.map((a) => {
    const submission = a.submissions && a.submissions.length > 0 ? a.submissions[0] : null;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      dueDate: a.dueDate,
      subject: a.subject,
      teacher: a.teacher,
      submission: submission
        ? {
            id: submission.id,
            status: submission.status,
            gradeScore: submission.gradeScore,
            feedback: submission.feedback,
            fileUrl: submission.fileUrl,
            fileName: submission.fileName,
            submittedAt: submission.submittedAt,
            gradedAt: submission.gradedAt,
          }
        : null,
      isSubmitted: Boolean(submission),
      isGraded: Boolean(submission && submission.gradeScore !== null),
    };
  });

  const upcomingAssessments = mappedAssessments.filter(
    (a) => !a.isSubmitted || new Date(a.dueDate) >= new Date()
  );
  const pendingActionAssessments = mappedAssessments.filter((a) => !a.isSubmitted);

  // 4. Fetch Attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
  });

  let present = 0;
  let late = 0;
  let absent = 0;

  attendanceRecords.forEach((r) => {
    const st = r.status.toLowerCase();
    if (st === "present") present++;
    else if (st === "late") late++;
    else if (st === "absent") absent++;
  });

  const totalDays = present + late + absent;
  const attendanceRate = totalDays > 0 ? Math.round(((present + late * 0.5) / totalDays) * 100) : 100;

  // 5. Fetch Grades
  const grades = await prisma.grade.findMany({
    where: { studentId: student.id },
    orderBy: [{ academicYear: "desc" }, { quarter: "desc" }],
    include: {
      teachingAssignment: {
        include: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
        },
      },
    },
  });

  // 6. Fetch Recent Course Materials
  const recentMaterials = await prisma.material.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      dob: student.dob,
      class: student.class,
      school: student.school,
      user: student.user,
      parents: student.parents.map((p) => p.parent),
    },
    schedule: {
      today: todaySlots,
      weekly: scheduleSlots,
      currentDay: currentDayName,
    },
    assessments: {
      items: mappedAssessments,
      upcoming: upcomingAssessments,
      pendingAction: pendingActionAssessments,
      totalCount: mappedAssessments.length,
      pendingCount: pendingActionAssessments.length,
    },
    attendance: {
      stats: {
        present,
        late,
        absent,
        total: totalDays,
        rate: attendanceRate,
      },
      recent: attendanceRecords.slice(0, 10),
    },
    grades: {
      items: grades,
      recent: grades.slice(0, 8),
    },
    materials: {
      recent: recentMaterials,
      totalCount: recentMaterials.length,
    },
  };
}
