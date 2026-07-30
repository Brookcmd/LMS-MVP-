import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth-utils";

async function main() {
  const SCHOOL_NAME = "Test School";
  const NUM_TEACHERS = 6;
  const NUM_CLASSES = 10;
  const STUDENTS_PER_CLASS = 25;

  const school = await prisma.school.findFirst({ where: { name: SCHOOL_NAME } });
  if (!school) throw new Error(`School not found: ${SCHOOL_NAME}`);

  // Subjects
  const subjectNames = ["Mathematics", "English", "Science", "History", "Art"];
  const subjects: any[] = [];
  for (const name of subjectNames) {
    const s = await prisma.subject.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      update: {},
      create: { schoolId: school.id, name },
    });
    subjects.push(s);
  }

  // Teachers
  const teachers: any[] = [];
  for (let i = 1; i <= NUM_TEACHERS; i++) {
    const email = `teacher${i}@example.com`;
    const existing = await prisma.user.findUnique({
      where: { email_schoolId: { email, schoolId: school.id } },
    });
    if (existing) {
      teachers.push(existing);
      continue;
    }

    const passwordHash = await hashPassword("Teacher@123");
    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        name: `Teacher ${i}`,
        email,
        role: "teacher",
        passwordHash,
        phone: null,
      },
    });
    teachers.push(user);
  }

  // Classes
  const classes: any[] = [];
  for (let c = 1; c <= NUM_CLASSES; c++) {
    const className = `Class ${c}`;
    let cls = await prisma.class.findFirst({ where: { schoolId: school.id, name: className } });
    if (!cls) {
      cls = await prisma.class.create({ data: { schoolId: school.id, name: className } });
    }
    classes.push(cls);

    // Assign 2 random teachers as class teachers
    const assigned = [] as number[];
    while (assigned.length < 2) {
      const t = teachers[Math.floor(Math.random() * teachers.length)];
      if (!assigned.includes(t.id)) assigned.push(t.id);
    }
    for (const teacherId of assigned) {
      const ct = await prisma.classTeacher.findFirst({ where: { classId: cls.id, teacherId } });
      if (!ct) {
        await prisma.classTeacher.create({ data: { classId: cls.id, teacherId } });
      }
    }

    // Create students
    for (let s = 1; s <= STUDENTS_PER_CLASS; s++) {
      const studentName = `Student ${c}-${s}`;
      const exists = await prisma.student.findFirst({ where: { schoolId: school.id, classId: cls.id, name: studentName } });
      if (exists) continue;
      const dob = new Date(2010 + (s % 10), (s % 12), ((s % 27) + 1));
      await prisma.student.create({ data: { schoolId: school.id, classId: cls.id, name: studentName, dob } });
    }
  }

  // Create teaching assignments: for each class and subject assign a random teacher
  for (const cls of classes) {
    for (const subj of subjects) {
      const teacher = teachers[Math.floor(Math.random() * teachers.length)];
      const ta = await prisma.teachingAssignment.findFirst({ where: { classId: cls.id, teacherId: teacher.id, subjectId: subj.id } });
      if (!ta) {
        await prisma.teachingAssignment.create({ data: { classId: cls.id, teacherId: teacher.id, subjectId: subj.id } });
      }
    }
  }

  const studentCount = await prisma.student.count({ where: { schoolId: school.id } });
  const classCount = await prisma.class.count({ where: { schoolId: school.id } });
  const teacherCount = await prisma.user.count({ where: { schoolId: school.id, role: "teacher" } });
  const subjectCount = await prisma.subject.count({ where: { schoolId: school.id } });

  console.log(`Demo data created: ${teacherCount} teachers, ${classCount} classes, ${studentCount} students, ${subjectCount} subjects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
