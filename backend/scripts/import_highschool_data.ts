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
  if (/^acconting\s+and\s+finance$/i.test(s)) return "Accounting and Finance";
  if (/^accounting\s+and\s+finance$/i.test(s)) return "Accounting and Finance";
  if (/^geography\s*$/i.test(s)) return "Geography";
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
  const BATCH_SIZE = 25;
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
  console.log("High School Data Import: Grades 9 to 12");
  console.log("=================================================");

  // 1. Verify / Setup School
  let school = await prisma.school.findUnique({ where: { id: SCHOOL_ID } });
  if (!school) {
    school = await prisma.school.create({
      data: { id: SCHOOL_ID, name: "Sheba Academy" },
    });
    console.log(`Created school: ${school.name} (ID: ${school.id})`);
  } else {
    console.log(`Target School: ${school.name} (ID: ${school.id})`);
  }

  // 2. Parse Teachers & Classes Workbook
  console.log("\nParsing '3 cycle Teachers name and Subject.xlsx'...");
  const teacherWb = new ExcelJS.Workbook();
  await teacherWb.xlsx.readFile(
    path.join(STUDENT_DETAILS_DIR, "3 cycle Teachers name and Subject.xlsx")
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

  for (const gradeStr of ["9", "10", "11", "12"]) {
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

      // Left section header
      if ((c1 === gradeStr || c2 === gradeStr) && c3 && c3.length === 1 && c3 >= "A" && c3 <= "Z") {
        const leftSec = c3;
        const leftClassName = `Grade ${gradeStr}${leftSec}`;

        if (!parsedClassesMap.has(leftClassName)) {
          const leftClass: ParsedClass = {
            name: leftClassName,
            grade: parseInt(gradeStr, 10),
            section: leftSec,
            homeroomTeacher: null,
            assignments: [],
          };

          for (let subR = r + 1; subR <= Math.min(r + 25, sheet.rowCount); subR++) {
            const subRow = sheet.getRow(subR);
            const subjVal = cleanText(subRow.getCell(2).value);
            const teachVal = cleanText(subRow.getCell(3).value);
            const fullRowText =
              cleanText(subRow.getCell(1).value) + " " + subjVal + " " + teachVal;

            if (fullRowText.includes("Home Room Teacher")) {
              const hrParts = fullRowText.split(/Home Room Teacher\s*:\s*/i);
              if (hrParts[1]) {
                const hrTeacher = normalizeName(
                  hrParts[1].replace(/Home Room Teacher.*/gi, "")
                );
                leftClass.homeroomTeacher = hrTeacher;
                teacherNamesSet.add(hrTeacher);
              }
              break;
            }

            if (
              subjVal &&
              teachVal &&
              subjVal !== "Subject" &&
              teachVal !== "Teacher's Name" &&
              isNaN(Number(subjVal))
            ) {
              const cleanSubj = normalizeSubject(subjVal);
              const cleanTeach = normalizeName(teachVal);
              leftClass.assignments.push({ subject: cleanSubj, teacher: cleanTeach });
              teacherNamesSet.add(cleanTeach);
              subjectNamesSet.add(cleanSubj);
            }
          }
          parsedClassesMap.set(leftClassName, leftClass);
        }

        // Right section header on same row
        if ((c5 === gradeStr || c6 === gradeStr) && c7 && c7.length === 1 && c7 >= "A" && c7 <= "Z") {
          const rightSec = c7;
          const rightClassName = `Grade ${gradeStr}${rightSec}`;

          if (!parsedClassesMap.has(rightClassName)) {
            const rightClass: ParsedClass = {
              name: rightClassName,
              grade: parseInt(gradeStr, 10),
              section: rightSec,
              homeroomTeacher: null,
              assignments: [],
            };

            for (let subR = r + 1; subR <= Math.min(r + 25, sheet.rowCount); subR++) {
              const subRow = sheet.getRow(subR);
              const subjVal = cleanText(subRow.getCell(6).value);
              const teachVal = cleanText(subRow.getCell(7).value);
              const fullRowText =
                cleanText(subRow.getCell(5).value) + " " + subjVal + " " + teachVal;

              if (fullRowText.includes("Home Room Teacher")) {
                const hrParts = fullRowText.split(/Home Room Teacher\s*:\s*/i);
                if (hrParts[1]) {
                  const hrTeacher = normalizeName(
                    hrParts[1].replace(/Home Room Teacher.*/gi, "")
                  );
                  rightClass.homeroomTeacher = hrTeacher;
                  teacherNamesSet.add(hrTeacher);
                }
                break;
              }

              if (
                subjVal &&
                teachVal &&
                subjVal !== "Subject" &&
                teachVal !== "Teacher's Name" &&
                isNaN(Number(subjVal))
              ) {
                const cleanSubj = normalizeSubject(subjVal);
                const cleanTeach = normalizeName(teachVal);
                rightClass.assignments.push({ subject: cleanSubj, teacher: cleanTeach });
                teacherNamesSet.add(cleanTeach);
                subjectNamesSet.add(cleanSubj);
              }
            }
            parsedClassesMap.set(rightClassName, rightClass);
          }
        }
      }
    }
  }

  console.log(`Found ${parsedClassesMap.size} class sections.`);
  console.log(`Found ${teacherNamesSet.size} unique teachers.`);
  console.log(`Found ${subjectNamesSet.size} unique subjects.`);

  // 3. Upsert Subjects
  console.log("\nUpserting subjects...");
  const subjectDbMap = new Map<string, number>(); // name -> id
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

  // 4. Create Teacher User Accounts
  console.log("\nProvisioning Teacher Accounts...");
  const usedEmails = new Set<string>();
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

  const teacherHashes = await hashBatch(teacherPassList);
  const teacherDbMap = new Map<string, number>(); // name -> userId

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
  const classDbMap = new Map<string, number>(); // className -> classId

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

    // Link homeroom teacher to class_teachers if present
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

  // 6. Parse Students from Grade Files
  console.log("\nParsing student roster files...");
  const gradeFiles = [
    "Grade 9 New.xlsx",
    "Grade 10 New.xlsx",
    "Grade 11 New.xlsx",
    "Grade 12 New.xlsx",
  ];

  interface RawStudent {
    name: string;
    className: string;
    sex: string | null;
  }

  const rawStudents: RawStudent[] = [];

  for (const gf of gradeFiles) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(STUDENT_DETAILS_DIR, gf));

    wb.eachSheet((sheet) => {
      const match = sheet.name.match(/(\d+)\s*[-]?\s*([A-Za-z])/i);
      if (!match) return;
      const targetClassName = `Grade ${match[1]}${match[2].toUpperCase()}`;

      for (let r = 3; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const nameVal = row.getCell(2).value;
        const name =
          typeof nameVal === "string"
            ? nameVal.trim()
            : nameVal && (nameVal as any).text
            ? (nameVal as any).text.trim()
            : null;
        const sexVal = row.getCell(3).value;
        const sex = typeof sexVal === "string" ? sexVal.trim() : null;

        if (name && name.length > 0 && isNaN(Number(name))) {
          rawStudents.push({
            name: normalizeName(name),
            className: targetClassName,
            sex,
          });
        }
      }
    });
  }

  console.log(`Parsed total of ${rawStudents.length} students across all grades.`);

  // 7. Provision Student Accounts and Student Profiles
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
  for (let i = 0; i < studentCreds.length; i++) {
    const stCred = studentCreds[i];
    const passwordHash = studentHashes[i];
    const classId = classDbMap.get(stCred.className);

    if (!classId) {
      console.warn(`Class not found for student ${stCred.name}: ${stCred.className}`);
      continue;
    }

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

    // Check or create Student record
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
        data: {
          userId: user.id,
        },
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

    if ((i + 1) % 100 === 0 || i === studentCreds.length - 1) {
      process.stdout.write(`\rImported ${i + 1} / ${studentCreds.length} students...`);
    }
  }
  console.log("\n");

  // 8. Export Credentials
  console.log("Writing accounts credentials files...");
  const exportDir = path.resolve(__dirname, "../../");

  // JSON Export
  const jsonExportPath = path.join(exportDir, "accounts_credentials.json");
  fs.writeFileSync(
    jsonExportPath,
    JSON.stringify(
      {
        school: "Sheba Academy (ID: 254)",
        generatedAt: new Date().toISOString(),
        teacherCount: teacherCreds.length,
        studentCount: studentCreds.length,
        teachers: teacherCreds,
        students: studentCreds,
      },
      null,
      2
    )
  );

  // CSV Export
  const csvExportPath = path.join(exportDir, "accounts_credentials.csv");
  const csvHeader = "Role,Name,Class,Email,Password,HomeroomFor\n";
  const csvRows: string[] = [];

  for (const t of teacherCreds) {
    const hr = t.homeroomClasses.length > 0 ? `"${t.homeroomClasses.join(", ")}"` : "";
    csvRows.push(`Teacher,"${t.name}","",${t.email},${t.password},${hr}`);
  }

  for (const s of studentCreds) {
    csvRows.push(`Student,"${s.name}","${s.className}",${s.email},${s.password},""`);
  }

  fs.writeFileSync(csvExportPath, csvHeader + csvRows.join("\n") + "\n");

  console.log(`✅ JSON Credentials saved to: ${jsonExportPath}`);
  console.log(`✅ CSV Credentials saved to: ${csvExportPath}`);

  // Summary
  console.log("\n=================================================");
  console.log("IMPORT COMPLETE SUMMARY");
  console.log("=================================================");
  console.log(`• School: Sheba Academy (ID: ${SCHOOL_ID})`);
  console.log(`• Classes created: ${parsedClassesMap.size}`);
  console.log(`• Subjects created: ${subjectNamesSet.size}`);
  console.log(`• Teachers created: ${teacherCreds.length}`);
  console.log(`• Students created: ${studentCreds.length}`);
  console.log(`• Total accounts generated: ${teacherCreds.length + studentCreds.length}`);
  console.log("\nSample Teacher Accounts:");
  teacherCreds.slice(0, 5).forEach((t) => {
    console.log(`  - ${t.name}: ${t.email} | ${t.password} ${t.homeroomClasses.length ? `[HR: ${t.homeroomClasses.join(", ")}]` : ""}`);
  });
  console.log("\nSample Student Accounts:");
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
