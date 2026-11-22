import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

const SCHOOL_ID = 254;
const STUDENT_DETAILS_DIR = path.resolve(__dirname, "../../student_details");

interface TeacherCred {
  role: "teacher";
  name: string;
  email: string;
  password: string;
  homeroomClasses: string[];
}

interface StudentCred {
  role: "student";
  name: string;
  className: string;
  email: string;
  password: string;
}

function cleanText(val: any): string {
  if (!val) return "";
  if (typeof val === "object") {
    if (val.richText && Array.isArray(val.richText)) {
      return val.richText.map((t: any) => t.text).join("").trim();
    }
    if (val.result !== undefined) return String(val.result).trim();
    if (val.text !== undefined) return String(val.text).trim();
  }
  return String(val).trim();
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

function normalizeSubject(subject: string): string {
  const s = normalizeName(subject);
  if (/^mathamatics$/i.test(s)) return "Mathematics";
  if (/^env'?t\s*science$/i.test(s)) return "Environmental Science";
  if (/^moral$/i.test(s)) return "Moral Education";
  return s;
}

function generatePassword(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const baseName = parts[0].replace(/[^a-zA-Z]/g, "") || "User";
  const capitalBase = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();

  const chars = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${capitalBase}@${rand}`;
}

function generateEmail(fullName: string, domain: string, existingEmails: Set<string>): string {
  const parts = fullName
    .toLowerCase()
    .replace(/[\/\\]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : (parts[0] || "user");
  let email = `${base}@${domain}`;
  let counter = 2;
  while (existingEmails.has(email)) {
    email = `${base}${counter}@${domain}`;
    counter++;
  }
  existingEmails.add(email);
  return email;
}

async function hashBatch(passwords: string[]): Promise<string[]> {
  const BATCH_SIZE = 50;
  const hashes: string[] = [];
  for (let i = 0; i < passwords.length; i += BATCH_SIZE) {
    const chunk = passwords.slice(i, i + BATCH_SIZE);
    const chunkHashes = await Promise.all(chunk.map((p) => bcrypt.hash(p, 10)));
    hashes.push(...chunkHashes);
    process.stdout.write(`\rHashed ${hashes.length} / ${passwords.length} passwords...`);
  }
  console.log("");
  return hashes;
}

async function main() {
  console.log("=================================================");
  console.log("First Cycle Data Import: Grades 1 to 4");
  console.log("=================================================");

  // 1. Verify School & load existing emails
  const school = await prisma.school.findUnique({ where: { id: SCHOOL_ID } });
  if (!school) {
    throw new Error(`School with ID ${SCHOOL_ID} not found.`);
  }
  console.log(`Target School: ${school.name} (ID: ${school.id})`);

  const existingUsers = await prisma.user.findMany({
    select: { email: true },
  });
  const usedEmails = new Set<string>(existingUsers.map((u) => u.email.toLowerCase()));
  console.log(`Loaded ${usedEmails.size} existing user emails to prevent collision.`);

  // 2. Parse Teachers & Classes
  console.log("\nParsing '1 cycle Teachers name and subject.xlsx'...");
  const teacherWb = new ExcelJS.Workbook();
  await teacherWb.xlsx.readFile(
    path.join(STUDENT_DETAILS_DIR, "1 cycle Teachers name and subject.xlsx")
  );

  interface ParsedClass {
    name: string;
    grade: number;
    section: string;
    homeroomTeacher: string | null;
    assignments: Array<{ subject: string; teacher: string }>;
  }

  const parsedClassesMap = new Map<string, ParsedClass>();
  const teacherNamesSet = new Set<string>();
  const subjectNamesSet = new Set<string>();

  for (const gradeStr of ["1", "2", "3", "4"]) {
    const sheet = teacherWb.getWorksheet(gradeStr);
    if (!sheet) continue;

    for (let r = 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const c1 = cleanText(row.getCell(1).value);
      const c2 = cleanText(row.getCell(2).value);
      const c3 = cleanText(row.getCell(3).value);
      const c5 = cleanText(row.getCell(5).value);
      const c6 = cleanText(row.getCell(6).value);
      const c7 = cleanText(row.getCell(7).value);

      // Left section
      if ((c1 === gradeStr || c2 === gradeStr) && c3 && c3.length === 1 && c3 >= "A" && c3 <= "Z") {
        const leftSec = c3;
        const leftClsName = `Grade ${gradeStr}${leftSec}`;
        if (!parsedClassesMap.has(leftClsName)) {
          const clsObj: ParsedClass = {
            name: leftClsName,
            grade: parseInt(gradeStr, 10),
            section: leftSec,
            homeroomTeacher: null,
            assignments: [],
          };
          for (let subR = r + 1; subR <= Math.min(r + 20, sheet.rowCount); subR++) {
            const sRow = sheet.getRow(subR);
            const subj = cleanText(sRow.getCell(2).value);
            const teach = cleanText(sRow.getCell(3).value);
            const fullText = cleanText(sRow.getCell(1).value) + " " + subj + " " + teach;

            if (fullText.toLowerCase().includes("home room teacher")) {
              const m = fullText.match(/home room teacher\s*[:_\-]+\s*(.+)/i);
              if (m && m[1]) {
                const hr = normalizeName(m[1].split(/home room teacher/i)[0]);
                clsObj.homeroomTeacher = hr;
                teacherNamesSet.add(hr);
              }
              break;
            }

            if (subj && teach && subj !== "Subject" && teach !== "Teacher's Name" && isNaN(Number(subj))) {
              const cleanSubj = normalizeSubject(subj);
              const cleanTeach = normalizeName(teach);
              clsObj.assignments.push({ subject: cleanSubj, teacher: cleanTeach });
              subjectNamesSet.add(cleanSubj);
              teacherNamesSet.add(cleanTeach);
            }
          }
          parsedClassesMap.set(leftClsName, clsObj);
        }
      }

      // Right section
      if ((c5 === gradeStr || c6 === gradeStr) && c7 && c7.length === 1 && c7 >= "A" && c7 <= "Z") {
        const rightSec = c7;
        const rightClsName = `Grade ${gradeStr}${rightSec}`;
        if (!parsedClassesMap.has(rightClsName)) {
          const clsObj: ParsedClass = {
            name: rightClsName,
            grade: parseInt(gradeStr, 10),
            section: rightSec,
            homeroomTeacher: null,
            assignments: [],
          };
          for (let subR = r + 1; subR <= Math.min(r + 20, sheet.rowCount); subR++) {
            const sRow = sheet.getRow(subR);
            const subj = cleanText(sRow.getCell(6).value);
            const teach = cleanText(sRow.getCell(7).value);
            const fullText = cleanText(sRow.getCell(5).value) + " " + subj + " " + teach;

            if (fullText.toLowerCase().includes("home room teacher")) {
              const m = fullText.match(/home room teacher\s*[:_\-]+\s*(.+)/i);
              if (m && m[1]) {
                const hr = normalizeName(m[1].split(/home room teacher/i)[0]);
                clsObj.homeroomTeacher = hr;
                teacherNamesSet.add(hr);
              }
              break;
            }

            if (subj && teach && subj !== "Subject" && teach !== "Teacher's Name" && isNaN(Number(subj))) {
              const cleanSubj = normalizeSubject(subj);
              const cleanTeach = normalizeName(teach);
              clsObj.assignments.push({ subject: cleanSubj, teacher: cleanTeach });
              subjectNamesSet.add(cleanSubj);
              teacherNamesSet.add(cleanTeach);
            }
          }
          parsedClassesMap.set(rightClsName, clsObj);
        }
      }
    }
  }

  // Ensure Grade 4H is included
  if (!parsedClassesMap.has("Grade 4H")) {
    parsedClassesMap.set("Grade 4H", {
      name: "Grade 4H",
      grade: 4,
      section: "H",
      homeroomTeacher: null,
      assignments: [],
    });
  }

  console.log(`Detected ${parsedClassesMap.size} classes (Grades 1 to 4).`);
  console.log(`Detected ${teacherNamesSet.size} unique primary teachers.`);
  console.log(`Detected ${subjectNamesSet.size} unique primary subjects.`);

  // 3. Upsert Subjects
  console.log("\nUpserting subjects...");
  const subjectDbMap = new Map<string, number>();
  for (const sName of subjectNamesSet) {
    const sub = await prisma.subject.upsert({
      where: {
        schoolId_name: {
          schoolId: SCHOOL_ID,
          name: sName,
        },
      },
      update: {},
      create: {
        schoolId: SCHOOL_ID,
        name: sName,
      },
    });
    subjectDbMap.set(sName, sub.id);
  }

  // Also load any existing subjects so teaching assignments can link
  const allDbSubjects = await prisma.subject.findMany({
    where: { schoolId: SCHOOL_ID },
  });
  for (const s of allDbSubjects) {
    subjectDbMap.set(s.name, s.id);
  }

  // 4. Create Teacher Accounts
  console.log("\nProvisioning Primary Teacher Accounts...");
  const teacherCreds: TeacherCred[] = [];
  const teacherPassList: string[] = [];
  const teacherNameList = Array.from(teacherNamesSet);

  for (const tName of teacherNameList) {
    const email = generateEmail(tName, "sheba.edu", usedEmails);
    const password = generatePassword(tName);
    teacherCreds.push({
      role: "teacher",
      name: tName,
      email,
      password,
      homeroomClasses: [],
    });
    teacherPassList.push(password);
  }

  console.log(`Hashing ${teacherPassList.length} teacher passwords...`);
  const teacherHashes = await hashBatch(teacherPassList);
  const teacherDbMap = new Map<string, number>();

  for (let i = 0; i < teacherCreds.length; i++) {
    const cred = teacherCreds[i];
    const passwordHash = teacherHashes[i];

    const user = await prisma.user.upsert({
      where: {
        email_schoolId: {
          email: cred.email,
          schoolId: SCHOOL_ID,
        },
      },
      update: {
        name: cred.name,
        role: "teacher",
        passwordHash,
      },
      create: {
        schoolId: SCHOOL_ID,
        name: cred.name,
        email: cred.email,
        role: "teacher",
        passwordHash,
      },
    });
    teacherDbMap.set(cred.name, user.id);
  }

  // 5. Create Classes and Teaching Assignments
  console.log("\nCreating classes and linking teaching assignments...");
  const classDbMap = new Map<string, number>();

  for (const [clsName, cData] of parsedClassesMap.entries()) {
    const hrTeacherId = cData.homeroomTeacher
      ? teacherDbMap.get(cData.homeroomTeacher) || null
      : null;

    if (cData.homeroomTeacher) {
      const cred = teacherCreds.find((tc) => tc.name === cData.homeroomTeacher);
      if (cred) cred.homeroomClasses.push(clsName);
    }

    let cls = await prisma.class.findFirst({
      where: { schoolId: SCHOOL_ID, name: clsName },
    });

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          schoolId: SCHOOL_ID,
          name: clsName,
          homeroomTeacherId: hrTeacherId,
        },
      });
    } else {
      cls = await prisma.class.update({
        where: { id: cls.id },
        data: { homeroomTeacherId: hrTeacherId },
      });
    }
    classDbMap.set(clsName, cls.id);

    // Link homeroom teacher to class_teachers
    if (hrTeacherId) {
      await prisma.classTeacher.upsert({
        where: { classId_teacherId: { classId: cls.id, teacherId: hrTeacherId } },
        update: {},
        create: { classId: cls.id, teacherId: hrTeacherId },
      });
    }

    // Link Subject Teachers & create TeachingAssignments
    for (const assign of cData.assignments) {
      const tId = teacherDbMap.get(assign.teacher);
      const sId = subjectDbMap.get(assign.subject);

      if (tId && sId) {
        await prisma.classTeacher.upsert({
          where: { classId_teacherId: { classId: cls.id, teacherId: tId } },
          update: {},
          create: { classId: cls.id, teacherId: tId },
        });

        await prisma.teachingAssignment.upsert({
          where: {
            classId_teacherId_subjectId: {
              classId: cls.id,
              teacherId: tId,
              subjectId: sId,
            },
          },
          update: {},
          create: {
            classId: cls.id,
            teacherId: tId,
            subjectId: sId,
          },
        });
      }
    }
  }

  // 6. Extract Students from G-1 to G-4
  console.log("\nParsing students from G-1.xlsx to G-4.xlsx...");
  interface RawStudent {
    name: string;
    className: string;
  }
  const rawStudents: RawStudent[] = [];

  // G-1
  const wb1 = new ExcelJS.Workbook();
  await wb1.xlsx.readFile(path.join(STUDENT_DETAILS_DIR, "G-1.xlsx"));
  const sheet1 = wb1.getWorksheet("Sheet1");
  if (sheet1) {
    const g1Sections: Array<{ name: string; col: number }> = [];
    sheet1.getRow(1).eachCell((c, col) => {
      const t = cleanText(c.value);
      const m = t.match(/Grade\s*1([A-Z])/i);
      if (m && !g1Sections.find((s) => s.name === `Grade 1${m[1].toUpperCase()}`)) {
        g1Sections.push({ name: `Grade 1${m[1].toUpperCase()}`, col });
      }
    });
    for (const s of g1Sections) {
      let nameCol = s.col + 1;
      for (let c = s.col; c <= s.col + 3; c++) {
        if (cleanText(sheet1.getRow(2).getCell(c).value).toLowerCase() === "name") {
          nameCol = c;
          break;
        }
      }
      for (let r = 3; r <= sheet1.rowCount; r++) {
        const name = cleanText(sheet1.getRow(r).getCell(nameCol).value);
        if (name && isNaN(Number(name))) {
          rawStudents.push({ name: normalizeName(name), className: s.name });
        }
      }
    }
  }

  // G-2
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.readFile(path.join(STUDENT_DETAILS_DIR, "G-2.xlsx"));
  const sheet2 = wb2.getWorksheet("Sheet1");
  if (sheet2) {
    const g2Sections: Array<{ name: string; col: number }> = [];
    sheet2.getRow(1).eachCell((c, col) => {
      const t = cleanText(c.value);
      const m = t.match(/Grade\s*2([A-Z])/i);
      if (m && !g2Sections.find((s) => s.name === `Grade 2${m[1].toUpperCase()}`)) {
        g2Sections.push({ name: `Grade 2${m[1].toUpperCase()}`, col });
      }
    });
    for (const s of g2Sections) {
      let nameCol = s.col + 1;
      for (let c = s.col; c <= s.col + 3; c++) {
        if (cleanText(sheet2.getRow(2).getCell(c).value).toLowerCase() === "name") {
          nameCol = c;
          break;
        }
      }
      for (let r = 3; r <= sheet2.rowCount; r++) {
        const name = cleanText(sheet2.getRow(r).getCell(nameCol).value);
        if (name && isNaN(Number(name))) {
          rawStudents.push({ name: normalizeName(name), className: s.name });
        }
      }
    }
  }

  // G-3
  const wb3 = new ExcelJS.Workbook();
  await wb3.xlsx.readFile(path.join(STUDENT_DETAILS_DIR, "G-3.xlsx"));
  const sheet3 = wb3.getWorksheet("Sheet1");
  if (sheet3) {
    const g3Sections: Array<{ name: string; col: number }> = [];
    sheet3.getRow(2).eachCell((c, col) => {
      const t = cleanText(c.value);
      const m = t.match(/3\s*[-]?\s*([A-Z])/i);
      if (m && !g3Sections.find((s) => s.name === `Grade 3${m[1].toUpperCase()}`)) {
        g3Sections.push({ name: `Grade 3${m[1].toUpperCase()}`, col });
      }
    });
    for (const s of g3Sections) {
      let nameCol = s.col;
      for (let c = s.col - 1; c <= s.col + 2; c++) {
        const head = cleanText(sheet3.getRow(3).getCell(c).value).toLowerCase();
        if (head.includes("name")) {
          nameCol = c;
          break;
        }
      }
      for (let r = 4; r <= sheet3.rowCount; r++) {
        const name = cleanText(sheet3.getRow(r).getCell(nameCol).value);
        if (name && isNaN(Number(name))) {
          rawStudents.push({ name: normalizeName(name), className: s.name });
        }
      }
    }
  }

  // G-4
  const wb4 = new ExcelJS.Workbook();
  await wb4.xlsx.readFile(path.join(STUDENT_DETAILS_DIR, "G-4.xlsx"));
  const sheet4 = wb4.getWorksheet("Sheet1");
  if (sheet4) {
    const g4Sections: Array<{ name: string; col: number }> = [];
    sheet4.getRow(2).eachCell((c, col) => {
      const t = cleanText(c.value);
      const m = t.match(/4\s*[-]?\s*([A-Z])/i);
      if (m && !g4Sections.find((s) => s.name === `Grade 4${m[1].toUpperCase()}`)) {
        g4Sections.push({ name: `Grade 4${m[1].toUpperCase()}`, col });
      }
    });
    for (const s of g4Sections) {
      let nameCol = s.col;
      for (let c = s.col - 1; c <= s.col + 2; c++) {
        const head = cleanText(sheet4.getRow(3).getCell(c).value).toLowerCase();
        if (head.includes("name")) {
          nameCol = c;
          break;
        }
      }
      for (let r = 4; r <= sheet4.rowCount; r++) {
        const name = cleanText(sheet4.getRow(r).getCell(nameCol).value);
        if (name && isNaN(Number(name))) {
          rawStudents.push({ name: normalizeName(name), className: s.name });
        }
      }
    }
  }

  console.log(`Parsed total of ${rawStudents.length} students across Grades 1 to 4.`);

  // 7. Provision Student Accounts & Profiles
  console.log("\nProvisioning Student Accounts & Profiles...");
  const studentCreds: StudentCred[] = [];
  const studentPassList: string[] = [];

  for (const st of rawStudents) {
    const email = generateEmail(st.name, "student.sheba.edu", usedEmails);
    const password = generatePassword(st.name);
    studentCreds.push({
      role: "student",
      name: st.name,
      className: st.className,
      email,
      password,
    });
    studentPassList.push(password);
  }

  console.log(`Hashing ${studentPassList.length} student passwords with bcrypt...`);
  const studentHashes = await hashBatch(studentPassList);

  console.log("\nSaving students to database...");
  const DB_CONCURRENCY = 20;
  for (let i = 0; i < studentCreds.length; i += DB_CONCURRENCY) {
    const chunk = studentCreds.slice(i, i + DB_CONCURRENCY);
    const chunkIndices = chunk.map((_, idx) => i + idx);

    await Promise.all(
      chunk.map(async (stCred, idx) => {
        const overallIdx = chunkIndices[idx];
        const passwordHash = studentHashes[overallIdx];
        const classId = classDbMap.get(stCred.className);

        if (!classId) return;

        // Upsert User
        const user = await prisma.user.upsert({
          where: {
            email_schoolId: {
              email: stCred.email,
              schoolId: SCHOOL_ID,
            },
          },
          update: {
            name: stCred.name,
            role: "student",
            passwordHash,
          },
          create: {
            schoolId: SCHOOL_ID,
            name: stCred.name,
            email: stCred.email,
            role: "student",
            passwordHash,
          },
        });

        // Upsert/Link Student Record
        const existingStudent = await prisma.student.findFirst({
          where: {
            schoolId: SCHOOL_ID,
            classId: classId,
            name: stCred.name,
          },
        });

        if (existingStudent) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: { userId: user.id },
          });
        } else {
          await prisma.student.create({
            data: {
              schoolId: SCHOOL_ID,
              classId: classId,
              name: stCred.name,
              userId: user.id,
            },
          });
        }
      })
    );

    const progress = Math.min(i + DB_CONCURRENCY, studentCreds.length);
    process.stdout.write(`\rImported ${progress} / ${studentCreds.length} students...`);
  }
  console.log("\n");

  // 8. Update and Append Credentials Files
  console.log("Updating accounts credentials files...");
  const exportDir = path.resolve(__dirname, "../../");

  // Update JSON Export
  const jsonExportPath = path.join(exportDir, "accounts_credentials.json");
  let existingJsonData: any = {
    school: "Sheba Academy (ID: 254)",
    teachers: [],
    students: [],
  };

  if (fs.existsSync(jsonExportPath)) {
    try {
      existingJsonData = JSON.parse(fs.readFileSync(jsonExportPath, "utf-8"));
    } catch (e) {
      console.warn("Could not parse existing credentials JSON, creating fresh one.");
    }
  }

  const combinedTeachers = [...(existingJsonData.teachers || []), ...teacherCreds];
  const combinedStudents = [...(existingJsonData.students || []), ...studentCreds];

  fs.writeFileSync(
    jsonExportPath,
    JSON.stringify(
      {
        school: "Sheba Academy (ID: 254)",
        lastUpdated: new Date().toISOString(),
        totalAccounts: combinedTeachers.length + combinedStudents.length,
        teacherCount: combinedTeachers.length,
        studentCount: combinedStudents.length,
        teachers: combinedTeachers,
        students: combinedStudents,
      },
      null,
      2
    )
  );

  // Append to CSV Export
  const csvExportPath = path.join(exportDir, "accounts_credentials.csv");
  const newCsvRows: string[] = [];

  for (const t of teacherCreds) {
    const hr = t.homeroomClasses.length > 0 ? `"${t.homeroomClasses.join(", ")}"` : "";
    newCsvRows.push(`Teacher,"${t.name}","",${t.email},${t.password},${hr}`);
  }

  for (const s of studentCreds) {
    newCsvRows.push(`Student,"${s.name}","${s.className}",${s.email},${s.password},""`);
  }

  fs.appendFileSync(csvExportPath, newCsvRows.join("\n") + "\n");

  console.log(`✅ Appended to JSON Credentials: ${jsonExportPath}`);
  console.log(`✅ Appended to CSV Credentials: ${csvExportPath}`);

  // Summary
  console.log("\n=================================================");
  console.log("FIRST CYCLE IMPORT SUMMARY");
  console.log("=================================================");
  console.log(`• School: Sheba Academy (ID: ${SCHOOL_ID})`);
  console.log(`• Classes created: ${parsedClassesMap.size}`);
  console.log(`• Subjects created/updated: ${subjectNamesSet.size}`);
  console.log(`• Teachers created: ${teacherCreds.length}`);
  console.log(`• Students created: ${studentCreds.length}`);
  console.log(`• New accounts generated: ${teacherCreds.length + studentCreds.length}`);
  console.log(`• Total system accounts now: ${combinedTeachers.length + combinedStudents.length}`);
  console.log("\nSample First Cycle Teacher Logins:");
  teacherCreds.slice(0, 5).forEach((t) => {
    console.log(`  - ${t.name}: ${t.email} | ${t.password} ${t.homeroomClasses.length ? `[HR: ${t.homeroomClasses.join(", ")}]` : ""}`);
  });
  console.log("\nSample First Cycle Student Logins:");
  studentCreds.slice(0, 5).forEach((s) => {
    console.log(`  - ${s.name} (${s.className}): ${s.email} | ${s.password}`);
  });
  console.log("=================================================");
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
