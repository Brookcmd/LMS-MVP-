import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-utils";

/**
 * Seed demo data for ICT department demo.
 * Uses school ID 12 (the school the developer has been testing with).
 * Creates 2 classes, 2 teachers, 10 students (5 per class), 2 parents,
 * parent-student links, and sample attendance records.
 */
async function main() {
  const SCHOOL_ID = 12;

  // Verify school exists
  const school = await prisma.school.findUnique({ where: { id: SCHOOL_ID } });
  if (!school) {
    console.error(`School with ID ${SCHOOL_ID} not found. Run prisma:seed first.`);
    process.exit(1);
  }
  console.log(`Using school: ${school.name} (ID: ${school.id})`);

  // ── Teachers ──
  const teacherData = [
    { name: "Alemayehu Bekele", email: "alembekele@school.edu", password: "Teacher@123" },
    { name: "Birtukan Tadesse", email: "birtadesse@school.edu", password: "Teacher@123" },
  ];

  const teachers: any[] = [];
  for (const t of teacherData) {
    let user = await prisma.user.findUnique({
      where: { email_schoolId: { email: t.email, schoolId: SCHOOL_ID } },
    });
    if (!user) {
      const passwordHash = await hashPassword(t.password);
      user = await prisma.user.create({
        data: {
          schoolId: SCHOOL_ID,
          name: t.name,
          email: t.email,
          role: "teacher",
          passwordHash,
          phone: null,
        },
      });
      console.log(`Created teacher: ${t.name} (${t.email})`);
    } else {
      console.log(`Teacher already exists: ${t.name} (${t.email})`);
    }
    teachers.push(user);
  }

  // ── Classes ──
  const classData = [
    { name: "Grade 10A", homeroomTeacherId: teachers[0].id },
    { name: "Grade 10B", homeroomTeacherId: teachers[1].id },
  ];

  const classes: any[] = [];
  for (const c of classData) {
    let cls = await prisma.class.findFirst({
      where: { schoolId: SCHOOL_ID, name: c.name },
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          schoolId: SCHOOL_ID,
          name: c.name,
          homeroomTeacherId: c.homeroomTeacherId,
        },
      });
      console.log(`Created class: ${c.name}`);
    } else {
      console.log(`Class already exists: ${c.name}`);
    }

    // Assign teacher to class via ClassTeacher
    const existingCT = await prisma.classTeacher.findFirst({
      where: { classId: cls.id, teacherId: c.homeroomTeacherId },
    });
    if (!existingCT) {
      await prisma.classTeacher.create({
        data: { classId: cls.id, teacherId: c.homeroomTeacherId },
      });
    }

    classes.push(cls);
  }

  // ── Students (5 per class) ──
  const studentNames = [
    ["Abebe Kebede", "Meseret Alemu", "Tekle Berhan", "Hanna Wondimu", "Dawit Eshetu"],
    ["Selam Tesfaye", "Yonas Girma", "Betelhem Hailu", "Ephrem Solomon", "Meron Assefa"],
  ];

  const students: any[] = [];
  for (let ci = 0; ci < classes.length; ci++) {
    for (const name of studentNames[ci]) {
      let student = await prisma.student.findFirst({
        where: { schoolId: SCHOOL_ID, classId: classes[ci].id, name },
      });
      if (!student) {
        student = await prisma.student.create({
          data: {
            schoolId: SCHOOL_ID,
            classId: classes[ci].id,
            name,
            dob: new Date(2007, 0, 1),
          },
        });
        console.log(`Created student: ${name} (${classes[ci].name})`);
      }
      students.push(student);
    }
  }

  // ── Parents ──
  const parentData = [
    { name: "Worku Abebe", email: "workuabebe@parent.com", password: "Parent@123", childName: "Abebe Kebede" },
    { name: "Tigist Hailu", email: "tigisthailu@parent.com", password: "Parent@123", childName: "Selam Tesfaye" },
  ];

  const parents: any[] = [];
  for (const p of parentData) {
    let user = await prisma.user.findUnique({
      where: { email_schoolId: { email: p.email, schoolId: SCHOOL_ID } },
    });
    if (!user) {
      const passwordHash = await hashPassword(p.password);
      user = await prisma.user.create({
        data: {
          schoolId: SCHOOL_ID,
          name: p.name,
          email: p.email,
          role: "parent",
          passwordHash,
          phone: null,
        },
      });
      console.log(`Created parent: ${p.name} (${p.email})`);
    }
    parents.push(user);

    // Link parent to child
    const child = students.find((s) => s.name === p.childName);
    if (child) {
      const existingLink = await prisma.parentStudent.findUnique({
        where: { parentUserId_studentId: { parentUserId: user.id, studentId: child.id } },
      });
      if (!existingLink) {
        await prisma.parentStudent.create({
          data: { parentUserId: user.id, studentId: child.id, isPrimary: true },
        });
        console.log(`Linked parent ${p.name} to child ${child.name}`);
      }
    }
  }

  // ── Subjects ──
  const subjectNames = ["Mathematics", "English", "Science"];
  const subjects: any[] = [];
  for (const name of subjectNames) {
    let subj = await prisma.subject.findUnique({
      where: { schoolId_name: { schoolId: SCHOOL_ID, name } },
    });
    if (!subj) {
      subj = await prisma.subject.create({ data: { schoolId: SCHOOL_ID, name } });
      console.log(`Created subject: ${name}`);
    }
    subjects.push(subj);
  }

  // ── Teaching Assignments ──
  for (const cls of classes) {
    for (const subj of subjects) {
      const teacherId = cls.id === classes[0].id ? teachers[0].id : teachers[1].id;
      const existingTA = await prisma.teachingAssignment.findFirst({
        where: { classId: cls.id, teacherId, subjectId: subj.id },
      });
      if (!existingTA) {
        await prisma.teachingAssignment.create({
          data: { classId: cls.id, teacherId, subjectId: subj.id },
        });
      }
    }
  }
  console.log("Teaching assignments created.");

  // ── Attendance (today, mark first 3 students present, last 2 absent) ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const cls of classes) {
    const classStudents = students.filter((s) => s.classId === cls.id);
    for (let si = 0; si < classStudents.length; si++) {
      const status = si < 3 ? "present" : "absent";
      const existingAtt = await prisma.attendance.findFirst({
        where: { studentId: classStudents[si].id, classId: cls.id, date: today },
      });
      if (!existingAtt) {
        const att = await prisma.attendance.create({
          data: {
            studentId: classStudents[si].id,
            classId: cls.id,
            date: today,
            status,
            markedBy: cls.id === classes[0].id ? teachers[0].id : teachers[1].id,
          },
        });
        console.log(`Attendance: ${classStudents[si].name} = ${status}`);

        // Create notification for absent students
        if (status === "absent") {
          const parentLink = await prisma.parentStudent.findFirst({
            where: { studentId: classStudents[si].id },
          });
          if (parentLink) {
            await prisma.notification.create({
              data: {
                parentUserId: parentLink.parentUserId,
                studentId: classStudents[si].id,
                attendanceId: att.id,
                type: "absence",
              },
            });
            console.log(`  -> Notification sent to parent of ${classStudents[si].name}`);
          }
        }
      }
    }
  }

  // ── Summary ──
  const counts = {
    teachers: await prisma.user.count({ where: { schoolId: SCHOOL_ID, role: "teacher" } }),
    classes: await prisma.class.count({ where: { schoolId: SCHOOL_ID } }),
    students: await prisma.student.count({ where: { schoolId: SCHOOL_ID } }),
    parents: await prisma.user.count({ where: { schoolId: SCHOOL_ID, role: "parent" } }),
    subjects: await prisma.subject.count({ where: { schoolId: SCHOOL_ID } }),
    attendances: await prisma.attendance.count({ where: { class: { schoolId: SCHOOL_ID } } }),
  };

  console.log("\n=== Demo Data Summary ===");
  console.log(JSON.stringify(counts, null, 2));
  console.log("\nLogin credentials:");
  console.log("  Admin:   admin@testschool.com / Admin@123");
  console.log("  Teacher: alembekele@school.edu / Teacher@123  (Grade 10A)");
  console.log("  Teacher: birtadesse@school.edu / Teacher@123  (Grade 10B)");
  console.log("  Parent:  workuabebe@parent.com / Parent@123   (child: Abebe Kebede)");
  console.log("  Parent:  tigisthailu@parent.com / Parent@123  (child: Selam Tesfaye)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });