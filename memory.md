# Memory — Parent Attendance History (Feature 7)

Last updated: 2026-07-07 00:14:52

## What was built

Completed Feature 7: backend API for parents to view a linked child's attendance history.

Files created:
- `backend/src/services/parent-attendance-service.ts` — parent-child ownership validation through `ParentStudent`, date range parsing, default range handling, and attendance query.
- `backend/src/controllers/parent-attendance-controller.ts` — request parsing for `studentId`, `from`, and `to`; consistent success/error responses.
- `backend/src/routes/parent.ts` — parent-only route group with `GET /parent/attendance`.

Files modified:
- `backend/src/app.ts` — mounted parent routes at `/parent`.
- `context/build-plan.md` — marked Feature 7 complete and added a progress log entry.

Also verified Feature 6 with an end-to-end smoke test before starting Feature 7: attendance batch create/update and teacher GET review flow worked.

## Decisions made

- Parent attendance lives in a separate parent-facing route: `GET /parent/attendance`, not in the teacher `/attendance` route.
- The endpoint requires `studentId`; optional `from` and `to` filters use `YYYY-MM-DD`.
- If no range is provided, the endpoint returns the last 30 days.
- Date ranges are capped at 180 days to keep the Phase 2 API simple and bounded.
- A parent can only retrieve records for a student linked to them through `ParentStudent`; unlinked students return `404`.
- The service treats `to` as the end of that date so same-day queries include attendance records for the selected day.

## Problems solved

- Express query params can include `ParsedQs`; the controller now accepts only string query values through a small `readQuery()` helper.
- Initial smoke test exposed a date-boundary bug where `to=YYYY-MM-DD` only matched midnight. Fixed by expanding `toDate` to `23:59:59.999`.

## Current state

- Feature 7 is implemented and reviewed.
- `npm.cmd run build` passes.
- Parent smoke test passed end to end:
  - Admin-created parent, teacher, class, students, and parent-student link.
  - Teacher marked attendance for linked and unlinked students.
  - Parent retrieved linked child's attendance history.
  - Parent lookup for unlinked student failed with `404`.
  - Temporary smoke-test data was cleaned up.
- Feature 6 and Feature 7 are marked complete in `context/build-plan.md`.
- Workspace still contains uncommitted Feature 6 and Feature 7 changes, plus generated Prisma client changes under `node_modules/.prisma/client`.

## Next session starts with

1. Start Feature 8 (Phase 2): in-app notification when a child is marked absent.
2. Use `/architect` before building Feature 8 because it touches attendance write flow, parent visibility, and likely notification data modeling.
3. Decide whether absence notifications need a new Prisma model or can be derived from attendance records for Phase 2.
4. After Feature 8, run `/review`, update `context/build-plan.md`, and run `/remember save`.

## Open questions

- Should absence notifications be persisted as their own records, or should the parent UI derive them from `Attendance.status = absent`?
- If persisted, should notifications be created synchronously inside `markAttendanceBatch` or through a later background/event pattern?
- Should parents be able to mark notifications as read in Phase 2, or is an unread/read state out of scope for the MVP?
