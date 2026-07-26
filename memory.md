# Memory — Parent UX calendar and quick actions

Last updated: 2026-07-18 19:30:30 +03:00

## What was built

- Updated `frontend/react/src/pages/ParentAttendance.jsx`:
  - Replaced the old from/to date input flow with a horizontal squircle-style date rail.
  - Added previous/next day controls and left/right rail scrolling.
  - Selecting a date reloads attendance with `from` and `to` set to the selected day.
  - Added empty state for days with no attendance record.
  - Added support for `?date=YYYY-MM-DD` so other pages can deep-link to a selected attendance day.
- Updated `frontend/react/src/pages/ParentDashboard.jsx`:
  - Made the homepage monthly calendar functional.
  - Calendar now renders the real selected month, supports previous/next month navigation, selectable days, today/selected states, and event dots from real notification/attendance dates.
  - Calendar selected-day summary shows alerts for that day and has a `View attendance` action that opens `/attendance?date=...`.
  - Made quick actions functional on the frontend:
    - `Report Absence` opens a modal with student, date, and reason.
    - `Request Early Leave` opens a modal with student, date, pickup time, and reason.
    - Linked students are loaded through `listParentStudents()`.
    - Submitted requests are shown under Quick Actions and persisted in `localStorage` per user.
- Updated `frontend/react/src/styles.css`:
  - Added styles for the attendance date rail, homepage calendar, quick-action modal, request cards, success state, and textarea fields.
- Updated `ui-registry.md` through imprint:
  - Added `Attendance Date Rail`.
  - Added `Homepage Monthly Calendar`.
  - Added `Parent Quick Actions`.

## Decisions made

- Treat "squirqles" as squircle-like rounded square day controls.
- Keep parent attendance API usage unchanged by sending the selected day as both `from` and `to`.
- Use the homepage calendar as a compact overview, not detailed attendance browsing.
- Use local persistence for parent-created absence and early-leave requests because no backend request endpoint exists yet.
- Quick actions open focused modal forms on the dashboard instead of navigating away.
- Keep UI styling aligned with existing tokens and patterns in `ui-registry.md`.

## Problems solved

- Parent attendance date browsing no longer depends on plain date inputs.
- Homepage calendar is no longer a static hardcoded 1-30 mock.
- Homepage calendar can now drive the attendance page via a date query param.
- Quick action buttons are no longer inert.
- Submitted quick-action requests survive refresh locally until backend support is added.

## Current state

- Frontend build passed after each UI change with `npm.cmd run build` from `frontend/react`.
- Current modified files:
  - `frontend/react/src/pages/ParentAttendance.jsx`
  - `frontend/react/src/pages/ParentDashboard.jsx`
  - `frontend/react/src/styles.css`
  - `ui-registry.md`
- `git diff --stat` currently reports 4 changed files with 595 insertions and 19 deletions.
- Git reports line-ending warnings that LF will be replaced by CRLF next time Git touches the edited frontend files and `ui-registry.md`.
- No backend endpoints or schema were added for parent-submitted absence/early-leave requests.

## Next session starts with

- Run `/remember restore`.
- Review the modified frontend files with `git diff`.
- Decide whether frontend-local quick actions are enough for the current MVP demo, or whether to add backend-backed parent request models/routes.
- If backend-backed requests are needed, add a request model and parent routes for submitting/listing absence and early-leave requests, then replace localStorage persistence with API calls.
- Consider running a visual check in the browser for the attendance rail, homepage calendar, and quick-action modal on mobile and desktop.

## Open questions

- Should absence and early-leave requests become real backend records before pilot use?
- Who should receive or approve parent-submitted requests: teacher, admin, or both?
- Should parent requests also appear in the Notifications page, or should they get their own requests/history surface?
