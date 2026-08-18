# Spec 0007: Full K-12 School Demo Seed Data

## Status
Approved (via `/grill-me` alignment)

## Context & Objectives
Expand `seed:demo` (`backend/scripts/seed_demo.ts`) to populate a full, realistic K-12 school structure (2,625 students, 75 classes, 100 teachers, 2,625 parents) with high performance and zero database bottlenecks.

## School Specifications
- **School ID**: `12` ("Test School")
- **Total Grades**: 15 (KG 1, KG 2, KG 3, Grade 1 through Grade 12)
- **Total Classes**: 75 classes (5 sections per grade: `A`, `B`, `C`, `D`, `E`)
  - Grades 11-12 streaming: 3 Natural Science classes (`Nat-A`, `Nat-B`, `Nat-C`) & 2 Social Science classes (`Soc-A`, `Soc-B`) per grade.
- **Students per Class**: 35 students
- **Total Students**: 2,625 students (75 classes × 35 students)
- **Total Teachers**: 100 teachers
  - **75 Homeroom Teachers**: Exactly 1 homeroom teacher assigned to each of the 75 classes.
  - **25 Specialist Floater Teachers**: Subject specialist teachers without homeroom assignments.
  - All 100 teachers assigned to teach subjects matching their target grade bands.
- **Parents**: 2,625 parent accounts (1 per student, linked via `ParentStudent`).

## Subject Structure
- **KG 1 - KG 3 (4 Subjects)**: English/Literacy, Numeracy, General Knowledge, Arts & Crafts.
- **Grade 1 - Grade 8 (12 Subjects)**: Mathematics, English, Amharic, Integrated Science, Physics, Chemistry, Biology, Social Studies, Civics, Information Technology, Visual Art, Physical Education.
- **Grade 9 - Grade 10 (10 Subjects)**: Mathematics, Physics, Chemistry, Biology, English, Civics, History, Geography, Information Technology, Physical Education.
- **Grade 11 - Grade 12 Natural Science (10 Subjects)**: Advanced Mathematics, Physics, Chemistry, Biology, English, Civics, Information Technology, Technical Drawing, Aptitude, Physical Education.
- **Grade 11 - Grade 12 Social Science (10 Subjects)**: Mathematics, History, Geography, Economics, Business, English, Civics, Information Technology, General Science, Physical Education.

## Data Seeding Strategy & Performance
- **Bulk Insert**: Use Prisma `createMany` and `skipDuplicates` for User, Student, ClassTeacher, ParentStudent, Attendance, Subject, TeachingAssignment, ScheduleSlot, Assessment, and Submission records.
- **Attendance**: Past 5 school days + today's attendance (~15,750 attendance records, ~90% present, 5% absent, 5% late) marked by homeroom teachers. Absence notifications generated for today's absent students.
- **Assessments & Submissions**: 1 active assessment per class with sample student submissions.

## Credentials Summary
- **Admin**: `admin@testschool.com` / `Admin@123`
- **Key Teachers**: Named accounts for representative classes (e.g. `alembekele@school.edu` for KG1-A, `birtadesse@school.edu` for G10-A, `solomon.girma@school.edu` for G12-Nat-A).
- **Other Teachers**: `teacher4@school.edu` to `teacher100@school.edu` (Password: `Teacher@123`).
- **Parents**: `parent1@parent.com` to `parent2625@parent.com` (Password: `Parent@123`).
