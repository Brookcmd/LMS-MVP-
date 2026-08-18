import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-utils";

/**
 * Seed full K-12 demo school data:
 * - 1 School
 * - 1 Admin User
 * - 100 Teachers (75 Homeroom Teachers, 25 Specialist Floaters)
 * - 75 Classes (KG1-3, G1-10, G11-12 Natural/Social Streams)
 * - 2,625 Students (35 students per class)
 * - 2,625 Parent Users linked to students
 * - Grade-band tailored subjects (KG: 4, G1-8: 12, G9-10: 10, G11-12 Nat: 10, G11-12 Soc: 10)
 * - Teaching Assignments & Weekly Schedule Slots
 * - 6 days of Attendance history (~15,750 records) + Notifications
 * - Sample Assessments & Submissions
 */
async function main() {
  console.log("Starting Full K-12 Demo Seeding...");
  const startTime = Date.now();
  // 1. School
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { name: "Sheba Academy" },
    });
    console.log(`Created School: ${school.name} (ID: ${school.id})`);
  } else {
    console.log(`Using existing School: ${school.name} (ID: ${school.id})`);
  }
  const SCHOOL_ID = school.id;

  // Cleanup any old records for school ID to ensure clean idempotent state
  console.log(`Cleaning up old data for School ID ${SCHOOL_ID}...`);
  await prisma.submission.deleteMany({ where: { student: { schoolId: SCHOOL_ID } } });
  await prisma.material.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.grade.deleteMany({ where: { student: { schoolId: SCHOOL_ID } } });
  await prisma.notification.deleteMany({ where: { student: { schoolId: SCHOOL_ID } } });
  await prisma.message.deleteMany({ where: { sender: { schoolId: SCHOOL_ID } } });
  await prisma.conversation.deleteMany({ where: { student: { schoolId: SCHOOL_ID } } });
  await prisma.attendance.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.scheduleSlot.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.assessment.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.parentStudent.deleteMany({ where: { student: { schoolId: SCHOOL_ID } } });
  await prisma.classTeacher.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.student.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.teachingAssignment.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.class.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.subject.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.user.deleteMany({ where: { schoolId: SCHOOL_ID } });

  const defaultPasswordHash = await hashPassword("Teacher@123");
  const parentPasswordHash = await hashPassword("Parent@123");
  const adminPasswordHash = await hashPassword("Admin@123");

  // 2. Admin User
  await prisma.user.upsert({
    where: { email_schoolId: { email: "admin@testschool.com", schoolId: SCHOOL_ID } },
    update: {},
    create: {
      schoolId: SCHOOL_ID,
      name: "Admin User",
      email: "admin@testschool.com",
      role: "admin",
      passwordHash: adminPasswordHash,
    },
  });

  // 3. Teachers (100 total)
  console.log("⏳ Seeding 100 teachers...");
  const teacherNames = [
    "Alemayehu Bekele", "Birtukan Tadesse", "Solomon Girma", "Tigist Hailu", "Worku Abebe",
    "Meseret Alemu", "Dawit Eshetu", "Hanna Wondimu", "Yonas Girma", "Betelhem Hailu",
    "Ephrem Solomon", "Meron Assefa", "Kassahun Fikre", "Rahel Getachew", "Tewodros Kassaye",
    "Saba Mulugeta", "Berhanu Zewde", "Genet Desta", "Samuel Tsegaye", "Kidist Haile",
  ];

  const teacherData: Array<{ schoolId: number; role: string; name: string; email: string; passwordHash: string }> = [];
  for (let i = 1; i <= 100; i++) {
    let name: string;
    let email: string;

    if (i === 1) {
      name = "Alemayehu Bekele";
      email = "alembekele@school.edu";
    } else if (i === 2) {
      name = "Birtukan Tadesse";
      email = "birtadesse@school.edu";
    } else if (i === 3) {
      name = "Solomon Girma";
      email = "solomongirma@school.edu";
    } else {
      const baseName = teacherNames[(i - 1) % teacherNames.length];
      name = `${baseName} ${Math.floor((i - 1) / teacherNames.length) + 1}`;
      email = `teacher${i}@school.edu`;
    }

    teacherData.push({
      schoolId: SCHOOL_ID,
      role: "teacher",
      name,
      email,
      passwordHash: defaultPasswordHash,
    });
  }

  await prisma.user.createMany({
    data: teacherData,
    skipDuplicates: true,
  });

  const teachers = await prisma.user.findMany({
    where: { schoolId: SCHOOL_ID, role: "teacher" },
    orderBy: { id: "asc" },
  });

  console.log(`✅ Loaded ${teachers.length} teachers.`);

  // 4. Define 75 Classes & Assign 75 Homeroom Teachers
  console.log("⏳ Creating 75 classes across 15 grades...");
  const gradeDefs: Array<{ grade: string; section: string }> = [];

  // KG 1 to KG 3 (3 grades x 5 sections = 15 classes)
  for (const kg of ["KG1", "KG2", "KG3"]) {
    for (const sec of ["A", "B", "C", "D", "E"]) {
      gradeDefs.push({ grade: kg, section: sec });
    }
  }

  // Grade 1 to Grade 10 (10 grades x 5 sections = 50 classes)
  for (let g = 1; g <= 10; g++) {
    for (const sec of ["A", "B", "C", "D", "E"]) {
      gradeDefs.push({ grade: `Grade ${g}`, section: sec });
    }
  }

  // Grade 11 & 12 (2 grades x 5 sections: 3 Natural Science, 2 Social Science = 10 classes)
  for (const g of [11, 12]) {
    gradeDefs.push({ grade: `Grade ${g}`, section: "Natural Science A" });
    gradeDefs.push({ grade: `Grade ${g}`, section: "Natural Science B" });
    gradeDefs.push({ grade: `Grade ${g}`, section: "Natural Science C" });
    gradeDefs.push({ grade: `Grade ${g}`, section: "Social Science A" });
    gradeDefs.push({ grade: `Grade ${g}`, section: "Social Science B" });
  }

  const classes: any[] = [];
  for (let i = 0; i < gradeDefs.length; i++) {
    const className = `${gradeDefs[i].grade} ${gradeDefs[i].section}`;
    const homeroomTeacherId = teachers[i % 75].id;
    const cls = await prisma.class.create({
      data: {
        schoolId: SCHOOL_ID,
        name: className,
        homeroomTeacherId,
      },
    });
    classes.push(cls);
  }
  console.log(`✅ Created ${classes.length} classes.`);

  // Link ClassTeachers for homeroom
  const classTeachersData = classes.map((c) => ({
    classId: c.id,
    teacherId: c.homeroomTeacherId!,
  }));
  await prisma.classTeacher.createMany({
    data: classTeachersData,
    skipDuplicates: true,
  });

  // 5. Subjects per Grade Band
  console.log("⏳ Seeding subjects for all grade tiers...");
  const subjectList = Array.from(
    new Set([
      // KG (4 subjects)
      "English Literacy", "Early Numeracy", "General Knowledge", "Arts & Crafts",
      // Primary / Middle G1-G8 (12 subjects)
      "Mathematics", "English Language", "Amharic Language", "Integrated Science",
      "Physics", "Chemistry", "Biology", "Social Studies", "Civics & Ethics",
      "Information Technology", "Visual Arts", "Physical Education",
      // High School G9-10 & G11-12 Streams
      "Advanced Mathematics", "Social Mathematics", "History", "Geography",
      "Economics", "Business Studies", "Technical Drawing", "Scholastic Aptitude",
    ])
  );

  await prisma.subject.createMany({
    data: subjectList.map((name) => ({ schoolId: SCHOOL_ID, name })),
    skipDuplicates: true,
  });

  const subjects = await prisma.subject.findMany({
    where: { schoolId: SCHOOL_ID },
  });
  const subjectMap = new Map(subjects.map((s) => [s.name, s.id]));

  // Helper to map subjects by grade class name
  function getSubjectsForClass(className: string): number[] {
    if (className.startsWith("KG")) {
      return ["English Literacy", "Early Numeracy", "General Knowledge", "Arts & Crafts"]
        .map((name) => subjectMap.get(name)!);
    }
    if (className.includes("Natural Science")) {
      return ["Advanced Mathematics", "Physics", "Chemistry", "Biology", "English Language", "Civics & Ethics", "Information Technology", "Technical Drawing", "Scholastic Aptitude", "Physical Education"]
        .map((name) => subjectMap.get(name)!);
    }
    if (className.includes("Social Science")) {
      return ["Social Mathematics", "History", "Geography", "Economics", "Business Studies", "English Language", "Civics & Ethics", "Information Technology", "Integrated Science", "Physical Education"]
        .map((name) => subjectMap.get(name)!);
    }
    if (className.startsWith("Grade 9") || className.startsWith("Grade 10")) {
      return ["Mathematics", "Physics", "Chemistry", "Biology", "English Language", "Civics & Ethics", "History", "Geography", "Information Technology", "Physical Education"]
        .map((name) => subjectMap.get(name)!);
    }
    // Grade 1 to 8 (12 subjects)
    return ["Mathematics", "English Language", "Amharic Language", "Integrated Science", "Physics", "Chemistry", "Biology", "Social Studies", "Civics & Ethics", "Information Technology", "Visual Arts", "Physical Education"]
      .map((name) => subjectMap.get(name)!);
  }

  // 6. Teaching Assignments & Schedule Slots
  console.log("⏳ Assigning subjects and generating schedule slots...");
  const teachingAssignmentsData: Array<{ classId: number; teacherId: number; subjectId: number }> = [];
  const scheduleSlotsData: Array<{
    classId: number;
    subjectId: number;
    teacherId: number;
    dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
    startTime: string;
    endTime: string;
    room: string;
  }> = [];

  const days: Array<"monday" | "tuesday" | "wednesday" | "thursday" | "friday"> = [
    "monday", "tuesday", "wednesday", "thursday", "friday"
  ];
  const timeSlots = [
    ["08:00", "08:45"], ["08:50", "09:35"], ["09:45", "10:30"],
    ["10:35", "11:20"], ["11:25", "12:10"]
  ];

  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci];
    const classSubjectIds = getSubjectsForClass(cls.name);

    for (let si = 0; si < classSubjectIds.length; si++) {
      const subjectId = classSubjectIds[si];
      // Pick a teacher from the 100 teachers pool
      const teacherId = teachers[(ci + si) % 100].id;

      teachingAssignmentsData.push({
        classId: cls.id,
        teacherId,
        subjectId,
      });

      // Assign first 5 subjects to schedule slots Mon-Fri
      if (si < 5) {
        for (const day of days) {
          const [startTime, endTime] = timeSlots[si];
          scheduleSlotsData.push({
            classId: cls.id,
            subjectId,
            teacherId,
            dayOfWeek: day,
            startTime,
            endTime,
            room: `Room ${100 + (ci % 30)}`,
          });
        }
      }
    }
  }

  await prisma.teachingAssignment.createMany({
    data: teachingAssignmentsData,
    skipDuplicates: true,
  });

  await prisma.scheduleSlot.createMany({
    data: scheduleSlotsData,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${teachingAssignmentsData.length} teaching assignments & ${scheduleSlotsData.length} timetable slots.`);

  // 7. Students (2,625 students = 75 classes x 35 students)
  console.log("⏳ Seeding 2,625 students...");
  const firstNames = [
    "Abebe", "Meseret", "Tekle", "Hanna", "Dawit", "Selam", "Yonas", "Betelhem", "Ephrem", "Meron",
    "Kassahun", "Rahel", "Tewodros", "Saba", "Berhanu", "Genet", "Samuel", "Kidist", "Tigist", "Worku",
    "Daniel", "Martha", "Nathnael", "Ruth", "Solomon", "Helen", "Elias", "Lydia", "Biniam", "Sara",
    "Ermias", "Bethlehem", "Mikiyas", "Mahlet", "Kaleb"
  ];
  const lastNames = [
    "Kebede", "Alemu", "Berhan", "Wondimu", "Eshetu", "Tesfaye", "Girma", "Hailu", "Solomon", "Assefa",
    "Fikre", "Getachew", "Kassaye", "Mulugeta", "Zewde", "Desta", "Tsegaye", "Haile", "Tadesse", "Bekele"
  ];

  const studentData: Array<{ schoolId: number; classId: number; name: string; dob: Date }> = [];
  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci];
    for (let stIdx = 1; stIdx <= 35; stIdx++) {
      const fname = firstNames[(ci * 35 + stIdx - 1) % firstNames.length];
      const lname = lastNames[(ci * 35 + stIdx - 1) % lastNames.length];
      studentData.push({
        schoolId: SCHOOL_ID,
        classId: cls.id,
        name: `${fname} ${lname} (${stIdx})`,
        dob: new Date(2010, 0, (stIdx % 28) + 1),
      });
    }
  }

  await prisma.student.createMany({
    data: studentData,
  });

  const students = await prisma.student.findMany({
    where: { schoolId: SCHOOL_ID },
    orderBy: { id: "asc" },
  });
  console.log(`✅ Loaded ${students.length} students.`);

  // 8. Parent Accounts (2,625 parents) & Links
  console.log("⏳ Seeding 2,625 parent accounts and links...");
  const parentUserData: Array<{ schoolId: number; role: string; name: string; email: string; passwordHash: string }> = [];
  for (let i = 0; i < students.length; i++) {
    const isDemoParent = i === 0;
    parentUserData.push({
      schoolId: SCHOOL_ID,
      role: "parent",
      name: isDemoParent ? "Worku Abebe" : `Parent of ${students[i].name}`,
      email: isDemoParent ? "workuabebe@parent.com" : `parent${i + 1}@parent.com`,
      passwordHash: parentPasswordHash,
    });
  }

  await prisma.user.createMany({
    data: parentUserData,
    skipDuplicates: true,
  });

  const parentUsers = await prisma.user.findMany({
    where: { schoolId: SCHOOL_ID, role: "parent" },
    orderBy: { id: "asc" },
  });

  const parentStudentData: Array<{ parentUserId: number; studentId: number; isPrimary: boolean }> = [];
  for (let i = 0; i < Math.min(students.length, parentUsers.length); i++) {
    parentStudentData.push({
      parentUserId: parentUsers[i].id,
      studentId: students[i].id,
      isPrimary: true,
    });
  }

  await prisma.parentStudent.createMany({
    data: parentStudentData,
    skipDuplicates: true,
  });
  console.log(`✅ Linked ${parentStudentData.length} parents to students.`);

  // 8b. Seed Demo Student User Account (Nathan Worku)
  console.log("⏳ Seeding demo student login account...");
  const studentPasswordHash = await hashPassword("Student@123");
  const demoStudentUser = await prisma.user.create({
    data: {
      schoolId: SCHOOL_ID,
      role: "student",
      name: "Nathan Worku",
      email: "nathan.worku@student.sheba.edu",
      passwordHash: studentPasswordHash,
    },
  });

  await prisma.student.update({
    where: { id: students[0].id },
    data: {
      name: "Nathan Worku",
      userId: demoStudentUser.id,
    },
  });
  console.log(`✅ Provisioned student account: nathan.worku@student.sheba.edu (ID: ${demoStudentUser.id})`);

  // 9. Attendance (Today + Past 5 Days = 6 Days ~15,750 records)
  console.log("⏳ Generating 6 days of attendance history...");
  const attendanceData: Array<{
    studentId: number;
    classId: number;
    date: Date;
    status: "present" | "absent" | "late";
    markedBy: number;
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const datesToSeed: Date[] = [];
  for (let d = 0; d < 6; d++) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    datesToSeed.push(dt);
  }

  for (const dt of datesToSeed) {
    for (let ci = 0; ci < classes.length; ci++) {
      const cls = classes[ci];
      const classStudents = students.filter((s) => s.classId === cls.id);
      const markedBy = cls.homeroomTeacherId || teachers[0].id;

      for (let si = 0; si < classStudents.length; si++) {
        const student = classStudents[si];
        // Status distribution: ~90% present, 5% absent, 5% late
        let status: "present" | "absent" | "late" = "present";
        const rand = (si + dt.getDate()) % 20;
        if (rand === 0) status = "absent";
        else if (rand === 1) status = "late";

        attendanceData.push({
          studentId: student.id,
          classId: cls.id,
          date: dt,
          status,
          markedBy,
        });
      }
    }
  }

  await prisma.attendance.createMany({
    data: attendanceData,
    skipDuplicates: true,
  });
  console.log(`✅ Seeded ${attendanceData.length} attendance records.`);

  // Today's Absence Notifications for Parents
  console.log("⏳ Generating absence notifications...");
  const todayAttendances = await prisma.attendance.findMany({
    where: { date: today, status: "absent" },
    take: 100,
  });

  const notificationData: Array<{ parentUserId: number; studentId: number; attendanceId: number; type: "absence" }> = [];
  for (const att of todayAttendances) {
    const parentLink = parentStudentData.find((p) => p.studentId === att.studentId);
    if (parentLink) {
      notificationData.push({
        parentUserId: parentLink.parentUserId,
        studentId: att.studentId,
        attendanceId: att.id,
        type: "absence",
      });
    }
  }

  await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  // 10. Sample Assessment & Submissions
  console.log("⏳ Creating sample assessments & submissions...");
  const firstClass = classes[0];
  const firstTeacher = teachers[0];
  const firstSubject = subjects[0];

  const assessment = await prisma.assessment.create({
    data: {
      title: "Quarter 1 Comprehensive Evaluation",
      description: "Mid-term assignment covering fundamental concepts.",
      type: "assignment",
      dueDate: new Date(Date.now() + 7 * 86400000),
      classId: firstClass.id,
      subjectId: firstSubject.id,
      teacherId: firstTeacher.id,
    },
  });

  const firstClassStudents = students.filter((s) => s.classId === firstClass.id);
  const submissionsData = firstClassStudents.slice(0, 10).map((st, idx) => ({
    assessmentId: assessment.id,
    studentId: st.id,
    content: "Assignment solution submission details.",
    status: "graded",
    gradeScore: 85 + (idx % 15),
    gradedAt: new Date(),
  }));

  await prisma.submission.createMany({
    data: submissionsData,
    skipDuplicates: true,
  });

  // 11. Sample Course Materials across Grade Bands
  console.log("⏳ Seeding sample course materials across all grade tiers...");
  const sampleMaterials = [
    {
      title: "Kindergarten English Alphabet & Phonics Pack",
      description: "[category:worksheet] Early literacy flashcards, tracing guides, and daily pronunciation drills.",
      fileName: "KG_Phonics_Activities.pdf",
      fileUrl: "/uploads/materials/sample_phonics.pdf",
      fileSize: 2450000,
      mimeType: "application/pdf",
      classId: classes[0].id, // KG1 A
      subjectId: subjectMap.get("English Literacy") || subjects[0].id,
      teacherId: teachers[0].id,
    },
    {
      title: "Grade 5 Mathematics - Fractions & Decimals Review",
      description: "[category:lecture_notes] Lecture slides explaining fractional reduction, common denominators, and word problem scenarios.",
      fileName: "G5_Math_Fractions_Lesson.pptx",
      fileUrl: "/uploads/materials/sample_fractions.pptx",
      fileSize: 4820000,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      classId: classes[20]?.id || classes[0].id, // Grade 5 A
      subjectId: subjectMap.get("Mathematics") || subjects[0].id,
      teacherId: teachers[1]?.id || teachers[0].id,
    },
    {
      title: "Grade 8 Integrated Science Lab Manual",
      description: "[category:syllabus] Comprehensive term curriculum guide, safety standards, and experimental worksheets for chemistry units.",
      fileName: "G8_Science_Lab_Manual_2026.pdf",
      fileUrl: "/uploads/materials/sample_lab_manual.pdf",
      fileSize: 7150000,
      mimeType: "application/pdf",
      classId: classes[35]?.id || classes[0].id, // Grade 8 A
      subjectId: subjectMap.get("Integrated Science") || subjects[0].id,
      teacherId: teachers[2]?.id || teachers[0].id,
    },
    {
      title: "Grade 10 National Physics Model Examination & Answer Key",
      description: "[category:past_exam] Official sample national examination questions covering mechanics, optics, and thermodynamics with complete solutions.",
      fileName: "G10_Physics_Model_Exam_2026.pdf",
      fileUrl: "/uploads/materials/sample_physics_exam.pdf",
      fileSize: 3200000,
      mimeType: "application/pdf",
      classId: classes[45]?.id || classes[0].id, // Grade 10 A
      subjectId: subjectMap.get("Physics") || subjects[0].id,
      teacherId: teachers[3]?.id || teachers[0].id,
    },
    {
      title: "Grade 12 Natural Science - Advanced Organic Chemistry Reference",
      description: "[category:reading] Supplementary academic textbook chapters on reaction mechanisms, polymers, and biomolecules.",
      fileName: "G12_Organic_Chemistry_Reference.pdf",
      fileUrl: "/uploads/materials/sample_chemistry.pdf",
      fileSize: 12500000,
      mimeType: "application/pdf",
      classId: classes[65]?.id || classes[0].id, // Grade 12 Natural Science
      subjectId: subjectMap.get("Chemistry") || subjects[0].id,
      teacherId: teachers[4]?.id || teachers[0].id,
    },
    {
      title: "Grade 12 Social Science - Microeconomics Case Studies",
      description: "[category:worksheet] Macro and Micro market structure analysis, inflation data sheets, and fiscal policy review questions.",
      fileName: "G12_Economics_Case_Studies.docx",
      fileUrl: "/uploads/materials/sample_economics.docx",
      fileSize: 1850000,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      classId: classes[70]?.id || classes[0].id, // Grade 12 Social Science
      subjectId: subjectMap.get("Economics") || subjects[0].id,
      teacherId: teachers[5]?.id || teachers[0].id,
    },
  ];

  await prisma.material.createMany({
    data: sampleMaterials,
    skipDuplicates: true,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Full K-12 Demo Seeding Completed in ${durationSec}s!`);

  // Summary Counts
  const counts = {
    schoolId: SCHOOL_ID,
    teachers: await prisma.user.count({ where: { schoolId: SCHOOL_ID, role: "teacher" } }),
    classes: await prisma.class.count({ where: { schoolId: SCHOOL_ID } }),
    students: await prisma.student.count({ where: { schoolId: SCHOOL_ID } }),
    parents: await prisma.user.count({ where: { schoolId: SCHOOL_ID, role: "parent" } }),
    subjects: await prisma.subject.count({ where: { schoolId: SCHOOL_ID } }),
    attendances: await prisma.attendance.count({ where: { class: { schoolId: SCHOOL_ID } } }),
  };

  console.log("\n=== Demo Data Summary ===");
  console.log(JSON.stringify(counts, null, 2));
  console.log("\nSample Credentials:");
  console.log("  Admin:     admin@testschool.com / Admin@123");
  console.log("  Teacher 1 (KG1-A): alembekele@school.edu / Teacher@123");
  console.log("  Teacher 2 (G10-A): birtadesse@school.edu / Teacher@123");
  console.log("  Teacher 3 (G12-Nat): solomongirma@school.edu / Teacher@123");
  console.log("  Parent 1:  parent1@parent.com / Parent@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });