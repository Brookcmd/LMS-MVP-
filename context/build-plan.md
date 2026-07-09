# Build Plan

This is the source of truth for what to build and in what order. If a session's task isn't on this list, stop and ask whether it belongs — don't quietly expand scope.

## Phase 1 — Foundation

1. [x] Project scaffold: Express + TypeScript + Prisma set up, connects to Postgres, `npm run dev` works
2. [x] Prisma schema for School, User, Student, ParentStudent, Class, Attendance (see `architecture.md`)
3. [x] Auth: signup (admin-created accounts only), login, JWT issuance, auth middleware
4. [x] Role middleware: admin / teacher / parent route protection
5. [x] Admin: create/list/edit classes, students, teachers, parent-student links (API first, minimal UI)

## Phase 2 — MVP (this is the demo)

6. [x] Teacher: mark daily attendance for their class (present / absent / late)
7. [x] Parent: view their child's attendance history (list or calendar)
8. [ ] In-app notification when a child is marked absent

**Phase 2 complete = the actual pilot-ready product. Do not start Phase 3 until Phase 2 is used successfully by a real class.** 

## Phase 3 — Grades

9. [ ] Teacher: enter grades per student per subject/assignment
10. [ ] Parent: view child's grades
11. [ ] Student: view own grades (only if student logins get added)

## Phase 4 — Deadlines

12. [ ] Teacher: create exam/assignment with a due date
13. [ ] Parent + student: see upcoming due dates

## Phase 5 — Stretch (only if time allows after Phase 2 is solid)

14. [ ] Course materials upload/download (MuStudyHub UI reuse fits here)
15. [ ] Teacher-parent messaging
16. [ ] Assignment submission
17. [ ] Admin analytics (attendance rate trends, grade averages)

## Explicitly cut — do not build

SCORM/xAPI, e-commerce/payments, gamification/badges, AI chatbots, BI tool integrations, GDPR/FERPA/SOC2 compliance tooling. See `project-overview.md` for why.

---

## Progress log

Update after every completed feature. Most recent entry at the top.

- 2026-07-06 — Feature 7 done. Added parent-only attendance history API (GET /parent/attendance) with required studentId, optional from/to date filters, a default 30-day window, a 180-day maximum range, and server-side parent-child ownership validation through ParentStudent.

- 2026-07-06 — Feature 6 done. Added teacher attendance marking API (POST /attendance/batch) with batch upsert for multiple students in one request. Teachers can mark attendance for today or up to 7 days in the past. Service validates teacher owns the class, date is in allowed window, and all students belong to the class. Added AttendanceStatus enum (present, absent, late). Prisma migration applied; database schema now in sync.

- 2026-07-06 — Feature 5 done. Added admin CRUD API for classes, students, teachers, and parent-student links, wired new routes into the Express app, and added a shared AppError type for typed service/controller failures.

- 2026-07-04 — Feature 3 done. Built complete auth system: signup endpoint (admin-only, creates teacher/parent accounts), login endpoint (returns user + JWT), JWT auth middleware, auth service with typed errors, password hashing with bcrypt. Added seed script to create initial admin account (admin@testschool.com / Admin@123). JWT expires in 24h, stored in localStorage on frontend. SchoolId pulled from JWT on signup, not from request body. Routes: POST /auth/signup (protected by future role middleware), POST /auth/login (public).
- 2026-07-04 — Feature 2 done. Built complete Prisma schema with School, User, Student, ParentStudent, Class, and Attendance models. Improved constraint on Attendance to (student_id, class_id, date) to support multiple classes per day. Added updated_at to Attendance for audit trail. ParentStudent uses explicit composite primary key. Student.classId has onDelete: Restrict. Schema validates, builds cleanly, Prisma client generated.
- 2026-07-04 — Feature 1 done. Backend scaffold is in place with Express, Prisma wired to backend/.env, a minimal health route, and root dev/build scripts.

Format: `YYYY-MM-DD — Feature N done. One line on what changed / what to know next session.`
