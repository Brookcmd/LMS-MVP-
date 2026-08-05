# 0001. Restrict schedule slot CRUD to admin only

**Date**: 2025-08-05
**Status**: Accepted

## Summary

Schedule slot creation, editing, and deletion are currently allowed for both teachers and admins. This change restricts those write operations to admin only, and moves the create/edit/delete UI from the teacher schedule page into the admin panel. Teachers and parents keep their existing read only schedule views. This is a permission tightening, not a new feature.

## Context

The schedule module lets users create, update, and delete timetable slots (class, subject, teacher, day, time, room). The backend routes `POST /schedule`, `PUT /schedule/:id`, and `DELETE /schedule/:id` currently accept both the `teacher` and `admin` roles. The service layer (`schedule-service.ts`) validates that the teacher is assigned to the class before allowing the operation.

In the target school deployment, the admin is the single authority for timetable management. Allowing teachers to create or delete slots introduces risk of conflicting or incorrect schedules. The admin should manage all schedule slots centrally, using the existing class-scoped schedule endpoints, with teachers and parents retaining read only access to view their own schedules.

No data model changes are required. The `ScheduleSlot` table and its relationships remain unchanged.

## Requirements

**User stories**:
- As an admin, I want to create, edit, and delete schedule slots for any class in my school so that I manage the timetable centrally.
- As a teacher, I want to view my teaching schedule (read only) so that I know when and where I teach.
- As a parent, I want to view my children's class schedules (read only) so that I know their timetable.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `POST /schedule`, `PUT /schedule/:id`, and `DELETE /schedule/:id` return 403 Forbidden for users with role `teacher` (and any non admin role). Only role `admin` is allowed.
- **AC-2**: `GET /schedule/teacher` continues to work for teachers (unchanged).
- **AC-3**: `GET /schedule/parent` continues to work for parents (unchanged).
- **AC-4**: The service layer for `createSlot`, `updateSlot`, and `deleteSlot` validates by admin's `schoolId` instead of teacher assignment ownership. Admin can create/edit/delete any slot for classes in their school.
- **AC-5**: The teacher schedule page (`TeacherSchedule.jsx`) has no Add Slot button, no Remove button, and no create/delete form. It is purely a read only view.
- **AC-6**: A new admin schedule management page (`AdminSchedule.jsx`) is added to the admin panel at `/admin/schedule`, with a navigation entry in `AdminLayout.jsx`. It fetches slots using `GET /schedule/class/:classId`, allows creating new slots, and allows deleting existing slots.
- **AC-7**: The admin schedule page provides class and teacher filter dropdowns to narrow the slot list.
- **AC-8**: Update `context/build-plan.md` with a progress log entry for this change, matching the existing log format (date - one line on what changed).

## Options considered

### Option 1: Restrict to admin only (permission change)

Tighten the role middleware on the three write endpoints from `["teacher", "admin"]` to `["admin"]`. Update the service layer to validate by admin schoolId. Move the create/delete UI into the admin panel. Teacher page becomes read only. Re-use existing `GET /schedule/class/:classId` for class slot retrieval.

**Pros**:
- Simple, minimal code change
- Single authority for timetable prevents conflicts
- Reuses existing GET endpoint without adding unneeded API surface
- No schema changes required

**Cons**:
- Teachers lose the ability to self manage their own slots
- Admin becomes a bottleneck for schedule changes

### Option 2: Keep teacher access, add approval workflow

Teachers create draft slots that require admin approval before becoming active.

**Pros**:
- Teachers retain autonomy for proposing changes
- Admin still has oversight

**Cons**:
- Significant new feature work (draft state, approval UI, notifications)
- Explicitly out of scope per the request

## Decision

**Chosen option**: Option 1: Restrict to admin only (permission change)

Restrict schedule slot write operations to admin role only, move the management UI to the admin panel using existing `GET /schedule/class/:classId` for reading class schedules, and make teacher/parent views read only. The user explicitly specified this is a permission change only with no approval workflow.

## Rationale

The school operates with a single admin who manages the entire timetable. Allowing teachers to create or delete slots created risk of scheduling conflicts and inconsistencies. Reusing `GET /schedule/class/:classId` keeps the backend clean without inventing redundant endpoints. The user explicitly requested no approval workflow, making Option 1 the correct and only viable path.

## Feature design

**Data model sketch**:
No changes. The existing `ScheduleSlot` model remains as is. All fields, relationships, and constraints are unchanged.

**API surface**:
| Endpoint | Method | Change | Auth | Key errors |
|---|---|---|---|---|
| /schedule | POST | Role guard: `["admin"]` only | bearer (admin) | 403 (non admin), 400 (validation) |
| /schedule/:id | PUT | Role guard: `["admin"]` only | bearer (admin) | 403 (non admin), 404, 400 |
| /schedule/:id | DELETE | Role guard: `["admin"]` only | bearer (admin) | 403 (non admin), 404 |
| /schedule/teacher | GET | Unchanged | bearer (teacher) | 401 |
| /schedule/parent | GET | Unchanged | bearer (parent) | 401 |
| /schedule/class/:classId | GET | Existing (used by admin page to fetch class schedule) | bearer (teacher/admin) | 401, 404 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| POST /schedule (admin) | new ScheduleSlot | classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room from request body; schoolId from admin JWT |
| GET /schedule/class/:classId | slots for a class | classId from path params; schoolId from admin JWT |
| Admin schedule page class filter | list of classes | fetched from existing admin classes API |
| Admin schedule page teacher filter | list of teachers | fetched from existing admin teachers API |

**Key invariants**:
- Only users with role `admin` can create, update, or delete schedule slots
- Admin can only manage slots for classes within their own school (schoolId match)
- startTime must be before endTime (unchanged validation)
- Teachers and parents retain full read access to their respective schedule views

**Security model**:
- Write operations (`POST`, `PUT`, `DELETE`): admin role only, scoped to their school by schoolId
- Read operations: teacher sees own slots, parent sees children's class slots, admin sees class slots via `/schedule/class/:classId`
- No new env vars or credentials required

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: admin creates a slot for a class in their school, slot appears in admin schedule page and teacher view, verifies **AC-1**, **AC-4**, **AC-6**
- Permission denial: teacher attempts POST /schedule, receives 403, verifies **AC-1**
- Read access preserved: teacher loads GET /schedule/teacher and sees their slots, verifies **AC-2**
- Admin class schedule view: admin loads slots for selected class via `GET /schedule/class/:classId`, verifies **AC-6**, **AC-7**
- UI: teacher schedule page has no create or delete controls, verifies **AC-5**
- Progress logging: `context/build-plan.md` updated with entry, verifies **AC-8**

## Build plan

1. Update role guards in `backend/src/routes/schedule.ts`: change `roleMiddleware(["teacher", "admin"])` to `roleMiddleware(["admin"])` on POST, PUT, DELETE routes, satisfies **AC-1**
2. Update `backend/src/services/schedule-service.ts`: replace teacher ownership checks in `createSlot`, `updateSlot`, `deleteSlot` with admin schoolId validation (verify class belongs to admin's school), satisfies **AC-4**
3. Update `TeacherSchedule.jsx`: remove the Add Slot button, create form, and Remove buttons. Keep the day tab strip, slot list display, and stats as read only, satisfies **AC-5**
4. Create `AdminSchedule.jsx` in `frontend/react/src/pages/admin/`: schedule management page sourcing data from `GET /schedule/class/:classId` (or looping over classes for a combined view), with class and teacher filter dropdowns, slot list, create form, and delete buttons, satisfies **AC-6**, **AC-7**
5. Add `/admin/schedule` route to `App.jsx` and add navigation entry in `AdminLayout.jsx`, satisfies **AC-6**
6. Verify teacher POST returns 403, admin CRUD works, teacher and parent reads are unchanged, satisfies **AC-1**, **AC-2**, **AC-3**
7. Update `context/build-plan.md` with a progress log entry summarizing the schedule permission restriction to admin only, satisfies **AC-8**

## Consequences

**Positive**:
- Single authority for schedule management eliminates conflicting timetable entries
- Simpler permission model (admin only writes)
- No unnecessary new API endpoints added
- Teachers see a clean read only view without controls they should not use

**Negative / tradeoffs**:
- Teachers cannot self manage their schedule slots; all changes go through admin
- Admin becomes a bottleneck for schedule changes (acceptable for single school pilot)

**Neutral**:
- No database migration needed
- No schema changes
- Existing schedule data is unaffected
