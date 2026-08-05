# Memory — Exam & Assignment Deadlines (Feature 12 & 13) & Realtime Schedule (Feature 19)

Last updated: 2026-08-05 08:33 AM (UTC+3)

## What was built

- **Feature 19 (Realtime Daily Schedule)**:
  - `backend/prisma/schema.prisma`: Added `DayOfWeek` enum (`monday`, `tuesday`, `wednesday`, `thursday`, `friday`) and `ScheduleSlot` model. Synced via `npx prisma db push` and generated `@prisma/client`.
  - `backend/src/routes/schedule.ts` & `app.ts`: Registered `/schedule` router for teacher CRUD and parent schedule retrieval.
  - `backend/scripts/seed_demo.ts`: Seeded 30 schedule slots across Grade 10A and Grade 10B.
  - `frontend/react/src/api/apiClient.js`: Added `createScheduleSlot`, `updateScheduleSlot`, `deleteScheduleSlot`, `getTeacherSchedule`, and `getParentSchedule`.
  - `frontend/react/src/pages/TeacherSchedule.jsx`: Teacher timetable UI with day tabs, slot management form, and delete support.
  - `frontend/react/src/pages/ParentSchedule.jsx`: Parent timetable UI with child selector, day tabs, vertical timeline, "Now in class" live indicator card, and 30s auto-refresh polling.
  - `frontend/react/src/components/BottomNav.jsx` & `App.jsx`: Registered `/teacher/schedule` and `/schedule` routes and navigation links.
- **Feature 12 & 13 (Exam & Assignment Deadlines)**:
  - `Assessment` database model, backend `/assessments` API, unit tests (8/8 passed), `TeacherDeadlines.jsx`, and `ParentDeadlines.jsx`.
  - All icons use Material Symbols (`<span className="material-symbols-outlined">...</span>`), zero emojis.

## Decisions made

- Realtime schedule polling is implemented on `ParentSchedule.jsx` using a 30-second interval timer.
- Clean Material Symbols icons (`<span className="material-symbols-outlined">...</span>`) are used throughout the UI.

## Problems solved

- Realtime class schedules now accessible to both parents and teachers with live status indicators.
- Seed data automatically populates full timetable slots for demo testing.

## Current state

- Features 12, 13, and 19 fully built, tested, seeded, and integrated.
- Backend server running on port 5200 with database synced. `npx tsc --noEmit` returns 0 errors.

## Next session starts with

- Select the next roadmap feature from Phase 5 Stretch:
  - Feature 18: Educational Mind-Sharpening Game
  - Feature 14 & 16: Course Materials Upload & Submissions

## Open questions

- Decide whether to implement Student logins for Phase 4/5 or keep student views focused under Parent accounts.