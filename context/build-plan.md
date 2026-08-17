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
8. [x] In-app notification when a child is marked absent

**Phase 2 complete = the actual pilot-ready product. Do not start Phase 3 until Phase 2 is used successfully by a real class.** 

## Phase 3 — Grades

9. [x] Teacher: enter grades per student per subject/assignment
10. [x] Parent: view child's grades
11. [x] Student: view own grades (student logins enabled and connected to Student profiles)

## Phase 4 — Deadlines

12. [x] Teacher: create exam/assignment with a due date
13. [x] Parent + student: see upcoming due dates

## Phase 5 — Stretch (only if time allows after Phase 2 is solid)

14. [ ] Course materials upload/download (MuStudyHub UI reuse fits here)
15. [x] Teacher-parent messaging
16. [ ] Assignment submission
17. [x] Admin analytics (attendance rate trends, grade averages)
18. [ ] A game where users can play games that sharpen the mind.
19. [x] A schedule where parents and students can see their daily schedule that reflects realtime schedule changes
20. [x] Teacher: bulk grade upload via Excel template (spec 0003)
21. [x] Merge landing page into LMS frontend (spec 0004)
22. [x] LMS UI/UX and aesthetic modernization across all portals (spec 0006)
23. [x] User Profile Management & Security (Name, Phone, Avatar Upload, Password Rotation)

## Explicitly cut — do not build

SCORM/xAPI, e-commerce/payments, gamification/badges, AI chatbots, BI tool integrations, GDPR/FERPA/SOC2 compliance tooling. See `project-overview.md` for why.

---

## Progress log

- 2026-08-17 — Feature 17 done. Built full institutional Admin Analytics Dashboard with executive KPIs, attendance status trends, class attendance rates, letter grade distribution histograms (Bands A-F), subject performance leaderboard, and at-risk student monitoring roster. Added `GET /analytics/admin` backend route and `analytics-service.ts`. Added `AdminAnalytics.jsx`, filter bar controls, topbar search shortcuts, and test suite `analytics.test.ts` (4/4 tests passed). Frontend build passed clean in 2.18s.

- 2026-08-17 — Feature 23 done. Added full user profile management and password security. Updated Prisma schema with `avatarUrl` on `User`. Implemented `GET /profile/me`, `PUT /profile/me`, and `POST /profile/change-password` routes with bcrypt hashing in `backend/src/routes/profile.ts`. Overhauled `Profile.jsx` with photo upload (JPG/PNG/WebP with live preview), editable personal info (Name, Phone), password update with current password validation, and institutional account overview. Added clickable profile avatar in topbar. All 49 backend unit tests pass.

- 2026-08-17 — Feature 22 done. Completed full LMS UI/UX and aesthetic modernization across all portals (spec 0006). Transferred AAU Sheba Navy (`#0B3861`) and Sheba Crimson (`#E63946`) institutional design system into shared `tokens.css` and overhauled `styles.css`. Implemented global `ToastProvider` for floating feedback notices, `SkeletonLoader` shimmer states, circular SVG `AttendanceRing`, and real-time pulsating `LiveClassCard`. Redesigned `ParentDashboard.jsx` with institutional hero banner, child switcher pills, and dual KPI cards. Upgraded `TeacherAttendance.jsx` with 1-click batch actions and live student status counters. Upgraded `ParentGrades.jsx` with visual score progress bars and letter grade badges. Integrated light/dark `ThemeProvider` across App, TopBar, Login, and AdminLayout. All 43 backend tests and frontend production build pass.

- 2026-08-12 — AAU-inspired landing page enhancements done. Added split photo-frame hero slider, royal blue quick portals bar, 1+3 asymmetric news grid, "Sheba in Motion" upcoming events calendar with date badges, and expanded footer social bar (X, YouTube, Facebook, LinkedIn, Telegram, TikTok, Instagram) + campus radio stream status.

- 2026-08-12 — Feature 21 done. Merged landing page from `landingpage/` into `frontend/react` under `/` route for unauthenticated visitors (spec 0004). Created `translations.js`, `universityData.js`, `landing.css`, 16 components under `src/components/landing/`, and `LandingPage.jsx`. Added `POST /api/contact` backend endpoint in `backend/src/routes/contact.ts`. Removed legacy standalone `landingpage/` directory.

- 2026-08-09 — Feature 11 done. Connected User (student role) to Student model with unique userId in Prisma. Added student authentication and dedicated endpoints (/student/attendance, /student/profile, /grades/student, /assessments/student). Enabled student access across Attendance, Grades, Deadlines, Schedule, and Notifications, omitting Direct Messaging for students. Fixed test teardown in setup.ts.


- 2026-08-08 — Feature 20 done. Added bulk grade upload via Excel template (spec 0003). New `grade-upload-service.ts` generates a downloadable `.xlsx` template pre-filled with the class roster and existing scores, and processes uploaded files with row-level validation and atomic writes using the existing Grade upsert pattern. Added `multer` (file uploads) and `exceljs` (Excel parsing) as new dependencies. Extended `TeacherGrades.jsx` with Download Template and Upload Grades controls.

- 2026-08-05 — Restricted schedule slot CRUD to admin only (spec 0001). Updated route guards on POST/PUT/DELETE /schedule to admin role only, updated service layer schoolId validation, made TeacherSchedule.jsx read-only, created AdminSchedule.jsx at /admin/schedule using GET /schedule/class/:classId with class and teacher filter dropdowns.

- 2026-08-05 — Feature 19 done. Added `ScheduleSlot` database model (day-of-week + HH:MM start/end time), backend `/schedule` API (teacher CRUD, parent read), 30 demo slots seeded, `TeacherSchedule.jsx` (day-tab strip, color-coded slots, add/delete form), `ParentSchedule.jsx` (day tabs, vertical timeline, "Now in class" live card, child selector, 30s polling).

- 2026-08-05 — Feature 12 & 13 done. Added `Assessment` database model (type: assignment, exam, quiz, project), backend `/assessments` API endpoints for teachers and parents, unit test suite (8 tests passed), teacher deadline management UI (`TeacherDeadlines.jsx`), and parent deadline schedule UI (`ParentDeadlines.jsx`).

- 2026-07-30 — Admin portal UI done. Multi-page React admin under `/admin/*` with layout shell, dashboard stats, CRUD for classes/students, teacher/parent signup via `POST /auth/signup`, subjects/assignments, and parent links with dropdowns. Added `GET /parents` and `GET /grades/teaching-assignments` for admin lists.

- 2026-07-10 — Feature 8 done. Added parent in-app absence notifications with `GET /parent/notifications` and `PATCH /parent/notifications/:notificationId/read`, plus notification creation when a student is marked absent in the attendance batch flow.

- 2026-07-06 — Feature 7 done. Added parent-only attendance history API (GET /parent/attendance) with required studentId, optional from/to date filters, a default 30-day window, a 180-day maximum range, and server-side parent-child ownership validation through ParentStudent.

- 2026-07-06 — Feature 6 done. Added teacher attendance marking API (POST /attendance/batch) with batch upsert for multiple students in one request. Teachers can mark attendance for today or up to 7 days in the past. Service validates teacher owns the class, date is in allowed window, and all students belong to the class. Added AttendanceStatus enum (present, absent, late). Prisma migration applied; database schema now in sync.

- 2026-07-06 — Feature 5 done. Added admin CRUD API for classes, students, teachers, and parent-student links, wired new routes into the Express app, and added a shared AppError type for typed service/controller failures.

- 2026-07-04 — Feature 3 done. Built complete auth system: signup endpoint (admin-only, creates teacher/parent accounts), login endpoint (returns user + JWT), JWT auth middleware, auth service with typed errors, password hashing with bcrypt. Added seed script to create initial admin account (admin@testschool.com / Admin@123). JWT expires in 24h, stored in localStorage on frontend. SchoolId pulled from JWT on signup, not from request body. Routes: POST /auth/signup (protected by future role middleware), POST /auth/login (public).
- 2026-07-04 — Feature 2 done. Built complete Prisma schema with School, User, Student, ParentStudent, Class, and Attendance models. Improved constraint on Attendance to (student_id, class_id, date) to support multiple classes per day. Added updated_at to Attendance for audit trail. ParentStudent uses explicit composite primary key. Student.classId has onDelete: Restrict. Schema validates, builds cleanly, Prisma client generated.
- 2026-07-04 — Feature 1 done. Backend scaffold is in place with Express, Prisma wired to backend/.env, a minimal health route, and root dev/build scripts.

Format: `YYYY-MM-DD — Feature N done. One line on what changed / what to know next session.`
