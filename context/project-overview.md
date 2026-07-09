# Project Overview

## What this is

A school attendance tracking system — Phase 1 of a larger school management system idea. One real school (run by a teammate's family) is the first customer and the only target for this phase. This is not being built speculatively for a market; it's software for one specific school, built by university students, with room to generalize later if it goes well.

## Who it's for

- **Parents** — check whether their child attended school today, and see attendance history. This is the core value proposition: parents currently have no visibility into day-to-day attendance.
- **Teachers** — mark daily attendance for their class, quickly. This has to be fast — a slow attendance flow means teachers stop using it, and then parents have nothing to see.
- **Admin** (school staff/owner) — set up classes, add students, add teachers, link parents to their children.
- **Students** — exist in the data model for future phases but have no dedicated login or UI in Phase 1.

## The problem being solved

Attendance tracking today is manual (paper, or nothing formal) and invisible to parents. A parent finds out their kid missed school days or weeks later, if at all. Phase 1 closes that gap for one thing only: attendance.

## In scope — Phase 1 (MVP)

- Auth with roles: admin, teacher, parent (student login is optional/later)
- Admin creates and manages: school, classes, students, teachers, parent-student links
- Teacher marks daily attendance (present / absent / late) for their class
- Parent views their child's attendance history
- Basic in-app notification when their child is marked absent

## Explicitly out of scope for now

Do not build these unless `build-plan.md` is explicitly updated to include them:

- Grades / gradebook (Phase 3)
- Assignments, exams, due dates (Phase 4)
- Course materials upload/download (Phase 5)
- Messaging between teachers and parents (Phase 5)
- Anything from this list: SCORM/xAPI content standards, e-commerce/payments, gamification/badges, AI chatbots, BI tool integrations (Power BI/Tableau), GDPR/FERPA/SOC2 compliance tooling. These came from generic "how to build an LMS" research and don't apply to a single-school pilot — they solve problems this project doesn't have.

## Success criteria for Phase 1

One real class at the school uses this daily for attendance, and that class's parents can log in and see accurate, up-to-date attendance for their kid. Nothing else needs to be true yet.

## Constraints worth knowing

- Built primarily solo, by a beginner backend developer, with a possible teammate — the plan has to survive either person working alone.
- Hard deadline: roughly 10 weeks from project start, targeting the Ethiopian New Year (Meskerem).
- The frontend UI is migrated from an existing project (MuStudyHub — Next.js/React), but that project's Supabase backend is not reused. Only visual/component code is reused; auth and data-fetching are rebuilt from scratch against this project's own API.
