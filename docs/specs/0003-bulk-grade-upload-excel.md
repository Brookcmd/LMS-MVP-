# 0003. Bulk Grade Upload via Excel Template

**Date**: 2026-08-08
**Status**: Proposed

## Summary

Teachers who lack reliable internet access cannot enter grades one by one through the app. This feature lets them download a pre-filled Excel template scoped to one teaching assignment (class + subject), fill in the grade column offline, and upload the completed file back through the app. The backend parses the template, validates every row, and writes valid grades using the same `saveAssignmentGrades` upsert logic already used by manual grade entry (Feature 9). Row-level error reporting tells the teacher exactly which rows to fix and re-upload.

## Context

Feature 9 (manual grade entry) is complete. A teacher loads `GET /grades/assignments/:assignmentId?academicYear=…&quarter=…`, sees the class roster with current scores, edits scores in a grid, and saves with `PUT /grades/assignments/:assignmentId` which calls `saveAssignmentGrades`. That function validates the teacher owns the assignment, validates every student belongs to the class, validates every score is 0–100, and upserts Grade rows in a single Prisma `$transaction`.

The existing `Grade` model:

```prisma
model Grade {
  id                   Int      @id @default(autoincrement())
  studentId            Int      @map("student_id")
  teachingAssignmentId Int      @map("teaching_assignment_id")
  academicYear         String   @map("academic_year")
  quarter              Int
  score                Int
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  student            Student            @relation(...)
  teachingAssignment TeachingAssignment @relation(...)

  @@unique([studentId, teachingAssignmentId, academicYear, quarter])
  @@index([teachingAssignmentId, academicYear, quarter])
  @@map("grades")
}
```

Key fields: `studentId` (Int FK to Student), `teachingAssignmentId` (Int FK to TeachingAssignment), `academicYear` (String, `YYYY/YY` format), `quarter` (Int, 1–4), `score` (Int, 0–100). The unique constraint on `(studentId, teachingAssignmentId, academicYear, quarter)` means the upsert is idempotent.

The app currently has zero file upload infrastructure. Express is configured with `express.json()` only — no `express.urlencoded`, no `multer`, no multipart body parsing. There are also no Excel or spreadsheet libraries in `package.json`. Both are new pieces of infrastructure that this feature introduces.

The ownership validation pattern comes from `POST /attendance/batch`, which calls `validateTeacherOwnsClass` (checks `ClassTeacher` by `classId_teacherId` composite key) and then verifies every student ID belongs to the class before writing. For grades, the equivalent is `assignmentForTeacher`, which validates that the `TeachingAssignment` row exists and belongs to the requesting teacher and school. This feature reuses `assignmentForTeacher` for ownership validation.

The teacher grade entry UI is `TeacherGrades.jsx`. It has a teaching assignment selector, academic year input, quarter selector, a student roster with score inputs, a toolbar with search/fill/copy-from-previous-quarter actions, and a "Save grades" button in a submit panel at the bottom. The download template and upload file controls will be added to this existing page — no new page is needed.

## Requirements

**User stories**:
- As a teacher without reliable internet, I want to download an Excel template for my class and subject, fill in grades offline, and upload the file when I next have connectivity so that I can enter all grades in one batch.
- As a teacher, I want clear per-row error messages when some rows in my upload fail validation so that I know exactly which rows to fix without re-entering the valid ones.

**Acceptance criteria**:
- **AC-1**: `GET /grades/assignments/:assignmentId/template?academicYear=…&quarter=…` returns a downloadable `.xlsx` file with columns `studentId`, `studentName`, `score`. Rows are pre-filled with the `studentId` and `name` of every student in the assignment's class. The `score` column is blank for students with no existing grade and pre-filled with the current score for students who already have one. The teacher only needs to fill in or edit the score column.
- **AC-2**: `POST /grades/assignments/:assignmentId/upload?academicYear=…&quarter=…` accepts a `multipart/form-data` upload with a single `.xlsx` file (field name `file`), parses it, and writes grades using the same underlying `Grade` upsert logic that `saveAssignmentGrades` uses.
- **AC-3**: The upload endpoint validates teacher ownership of the teaching assignment using the same `assignmentForTeacher` check already used by `PUT /grades/assignments/:assignmentId`. Returns 403 if the teacher is not assigned.
- **AC-4**: Every row is validated independently. Per-row errors include: missing `studentId`, `studentId` not found in the class, missing `score`, `score` not an integer, `score` outside 0–100, and duplicate `studentId` rows. The response reports each failed row with its literal spreadsheet row number (the header is row 1, so the first data row is reported as row 2, the second data row as row 3, and so on) and a human-readable error message.
- **AC-5**: The upload uses atomic semantics: grades are written only when every row passes validation. If any row fails, zero grades are written and the full error list is returned. This prevents partial state where a teacher does not know which rows were saved and which were not.
- **AC-6**: File upload handling uses `multer` with memory storage and a 2 MB file size limit. Only `.xlsx` files are accepted. Files exceeding the size limit or with the wrong extension return 400.
- **AC-7**: The response for a successful upload uses the standard success shape: `{ success: true, data: { saved: number, academicYear: string, quarter: number } }`. The response for validation failures uses the standard failure shape: `{ success: false, error: { message: "Upload failed validation", code: "VALIDATION_FAILED", details: Array<{ row: number, studentId: number | null, message: string }> } }`. This follows `code-standards.md`: `success: true` only when grades were actually written, `success: false` when the upload was rejected due to row-level validation errors.
- **AC-8**: Update `context/build-plan.md` with this as a new numbered feature and a progress log entry once done, matching the existing format.
- **AC-9**: The existing `TeacherGrades.jsx` page is extended with a "Download template" button and an "Upload grades" file input control, wired to the two new endpoints. No new page is created. The upload control displays row-level error details inline when the backend returns validation failures.

## Options considered

### Option 1: Atomic writes only (all-or-nothing per upload)

Parse and validate every row. If all rows pass, write all grades in a single transaction. If any row fails, write nothing and return the full error list.

**Pros**:
- Teacher always knows the complete state: either everything saved or nothing saved.
- No ambiguity about which rows made it to the database and which did not.
- Simpler mental model for the teacher: fix the errors, re-upload the entire file.

**Cons**:
- One bad row blocks all valid rows from being saved.
- Teacher must re-upload the entire file even if only one row was wrong.

### Option 2: Partial writes (save valid rows, report failed ones)

Validate each row independently. Write all valid rows. Return a list of failed rows so the teacher can fix and re-upload only those.

**Pros**:
- Valid grades are saved immediately without waiting for the teacher to fix errors.
- Teacher only needs to re-upload the failed subset.

**Cons**:
- Teacher must track which rows were saved and which were not, which is error-prone in an offline workflow where they cannot immediately verify.
- Partial state is confusing: if the teacher fixes the errors and re-uploads the full file, the already-saved rows get upserted again (safe due to the unique constraint, but unexpected).
- The template pre-fills existing scores, so a re-upload of the full corrected file is cheap and idempotent anyway.

### Option 3: Excel library choice — ExcelJS vs SheetJS

**ExcelJS** (`exceljs` on npm): MIT-licensed, streams, native TypeScript types, generates and reads `.xlsx` with formatting (column widths, header styles, data validation). ~2 MB install. Active maintenance.

**SheetJS** (`xlsx` on npm): Dual-licensed (Community Edition is Apache-2.0 but the pro version is commercial). Larger API surface, but the community edition has restrictive feature gates on write formatting. TypeScript types via DefinitelyTyped (`@types/xlsx`).

**Decision**: ExcelJS. MIT license with no feature gates, built-in TypeScript types, and native streaming for both read and write. The project has no existing Excel dependency to conflict with.

### Option 4: File upload middleware — multer vs busboy vs formidable

The app has no existing multipart/form-data handling. Express 5 does not include a built-in body parser for multipart.

**multer**: The de facto Express file upload middleware. Memory storage avoids disk I/O for small files. Well-documented, actively maintained, 13M+ weekly npm downloads.

**busboy**: Lower-level streaming parser. Requires manual integration with Express. No built-in file size limits or field name filtering.

**formidable**: Full-featured but heavier than needed for a single-file upload use case. Writes to disk by default.

**Decision**: multer with memory storage. It is the standard Express choice, requires minimal setup, and memory storage is appropriate since files are small (a class roster is typically under 100 KB, capped at 2 MB).

## Decision

**Chosen option**: Option 1 (atomic writes) with ExcelJS for Excel parsing and multer for file uploads.

## Rationale

Atomic writes are the correct choice for an offline workflow. The teacher fills in the template without internet access and uploads it later. If the upload partially succeeds, the teacher has no way to verify which rows were saved without going back online and checking the grade roster. With atomic semantics, the outcome is unambiguous: either everything saved (success) or nothing saved (error list). Since the template pre-fills existing scores, re-uploading a corrected file is idempotent — already-correct rows simply upsert to the same value.

The upload endpoint reuses the existing `assignmentForTeacher` ownership check and the same `Grade` upsert pattern from `saveAssignmentGrades`. It is a new input path (Excel file → parsed rows) into the same write logic (validate students in class, validate scores, transactional upsert), not a parallel grading system.

ExcelJS over SheetJS because the MIT license is clean and the built-in formatting API (column widths, header styling, data validation on the score column) makes the template more usable without a pro license. multer over busboy/formidable because it is the standard Express middleware and requires minimal code for a single-file memory upload.

## Feature design

**Data model sketch**:

No changes. The existing `Grade` model, `TeachingAssignment` model, and `Student` model are used as-is. No new tables, columns, or migrations.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /grades/assignments/:assignmentId/template | GET | `academicYear` (query), `quarter` (query) | `.xlsx` file download (Content-Disposition: attachment) | bearer (teacher) | 400 (invalid year/quarter), 403 (not assigned) |
| /grades/assignments/:assignmentId/upload | POST | `academicYear` (query), `quarter` (query), `file` (multipart) | Success: `{ saved, academicYear, quarter }`. Failure: `{ message, code, details: errors[] }` | bearer (teacher) | 400 (no file, wrong type, too large, parse error), 403 (not assigned), 422 (row validation failed) |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| GET template | Pre-filled studentId and studentName columns | `prisma.student.findMany({ where: { classId: assignment.classId }, orderBy: { name: "asc" } })` |
| GET template | Pre-filled score column (existing grades) | `prisma.grade.findMany({ where: { teachingAssignmentId, academicYear, quarter } })` joined to the student list |
| GET template | Filename | `grades-{className}-{subjectName}-{academicYear}-Q{quarter}.xlsx` |
| POST upload | Parsed rows | ExcelJS reads the uploaded buffer, iterates rows starting at row 2 (row 1 is the header) |
| POST upload | Ownership validation | `assignmentForTeacher(assignmentId, teacherId, schoolId)` — same function used by `saveHandler` |
| POST upload | Student membership validation | `prisma.student.count({ where: { id: { in: studentIds }, classId: assignment.classId } })` — same pattern used by `saveAssignmentGrades` |
| POST upload | Grade writes | `prisma.grade.upsert` in a `$transaction` — same pattern used by `saveAssignmentGrades` |
| Download template button | Triggers browser file download | `downloadGradeTemplate({ assignmentId, academicYear, quarter })` in `apiClient.js`, fetches blob from `GET /grades/assignments/:assignmentId/template` |
| Upload file control | Sends file to backend, displays result or errors | `uploadGradeFile({ assignmentId, academicYear, quarter, file })` in `apiClient.js`, posts `FormData` to `POST /grades/assignments/:assignmentId/upload` |

**Key invariants**:
- The template is the input contract. The upload endpoint expects columns in the exact order: `studentId` (column A), `studentName` (column B, ignored during parsing — present only for the teacher's reference), `score` (column C). Free-form spreadsheets are not supported.
- `studentId` values in the uploaded file must match Student IDs pre-filled in the template. Name-based matching is never used.
- Scores must be integers from 0 to 100 (same validation as `saveAssignmentGrades`).
- `academicYear` must match `YYYY/YY` format. `quarter` must be 1–4 (same validation helpers already in `grade-service.ts`).
- Uploads are atomic: either all rows are written in a transaction or none are.
- The unique constraint `(studentId, teachingAssignmentId, academicYear, quarter)` makes repeated uploads idempotent (upsert).
- Rows with a blank score cell are silently skipped (treated as "no grade entered for this student"), not treated as errors. This lets a teacher submit grades for a partial class without filling every row.
- Duplicate `studentId` values within the uploaded file are reported as row-level errors.
- Row numbers in error responses refer to literal spreadsheet row numbers (header = row 1, first data row = row 2).

**Security model**:
- Both endpoints require authentication (JWT bearer token via `authMiddleware`) and the `teacher` role (via `roleMiddleware(["teacher"])`).
- The `assignmentForTeacher` function validates the teacher is assigned to the specific class + subject + school combination. This is the same ownership check used by `PUT /grades/assignments/:assignmentId`.
- multer is configured with a 2 MB file size limit and a file filter that rejects non-`.xlsx` files, preventing abuse of the upload endpoint.
- Uploaded files are held in memory only for the duration of the request and never written to disk. No file cleanup is needed.
- No new environment variables or credentials are required.

**Critical test scenarios**:
- Happy path: Teacher downloads template for their assignment, fills in scores, uploads it, all grades are saved. Verify response matches `{ success: true, data: { saved: N } }`. Verifies **AC-1**, **AC-2**, **AC-3**, **AC-7**.
- Ownership denial: Teacher uploads a file for an assignment they are not assigned to, receives 403. Verifies **AC-3**.
- Row-level errors: Upload a file with one valid row, one row with `score: 150`, one row with `studentId: 99999` (not in class), and one row with a blank `studentId`. Zero grades saved, response returns `{ success: false, error: { message: "Upload failed validation", code: "VALIDATION_FAILED", details: [...] } }` with three error objects whose `row` values are literal spreadsheet row numbers (≥ 2). Verifies **AC-4**, **AC-5**, **AC-7**.
- Atomic rollback: Upload a file where rows 2–5 are valid and row 6 has an invalid score. Verify that zero Grade rows were created. Verifies **AC-5**.
- File validation: Upload a `.csv` file, receive 400. Upload a 3 MB `.xlsx` file, receive 400. Verifies **AC-6**.
- Idempotent re-upload: Upload the same valid file twice. Verify the second upload upserts without error and final scores match. Verifies **AC-2**.
- Blank score rows: Upload a file where some score cells are blank. Verify those rows are skipped and the remaining valid rows are saved. Verifies **AC-4**.
- Frontend integration: Teacher selects an assignment, clicks "Download template", receives a file. Teacher selects a file in the upload control, clicks upload, sees success message and refreshed roster. On validation failure, error details are displayed inline with row numbers. Verifies **AC-9**.

## Build plan

1. Install `exceljs` and `multer` as production dependencies, and `@types/multer` as a dev dependency. Run `npm install exceljs multer` and `npm install -D @types/multer`. These are new dependencies — the project has no existing Excel or file upload libraries. Satisfies **AC-1**, **AC-2**, **AC-6**.

2. Create `backend/src/services/grade-upload-service.ts` with two exported functions:
   - `generateGradeTemplate(assignmentId, teacherId, schoolId, academicYear, quarter)`: calls `assignmentForTeacher` for ownership, queries students in the class and existing grades, builds an ExcelJS workbook with a single worksheet, returns the workbook buffer. Satisfies **AC-1**.
   - `processGradeUpload(assignmentId, teacherId, schoolId, academicYear, quarter, fileBuffer)`: calls `assignmentForTeacher` for ownership, parses the Excel buffer with ExcelJS, validates each row (studentId present, studentId exists in class, score valid), collects row-level errors with literal spreadsheet row numbers (row 2+). If all rows pass, upserts grades in a `$transaction` using the same upsert pattern as `saveAssignmentGrades` and returns `{ saved: N }`. If any row fails, returns `{ saved: 0, errors: [...] }`. Satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**.

3. Create `backend/src/controllers/grade-upload-controller.ts` with `downloadTemplateHandler` and `uploadGradesHandler`. The upload handler configures multer with memory storage and a 2 MB limit as route-level middleware. Both handlers use the same `fail` and `user` helpers as the existing grade controller. The upload handler checks the result from `processGradeUpload`: if `errors` is present, it returns `{ success: false, error: { message: "Upload failed validation", code: "VALIDATION_FAILED", details: result.errors } }`. If `saved > 0`, it returns `{ success: true, data: result }`. Satisfies **AC-6**, **AC-7**.

4. Add two new routes to `backend/src/routes/grades.ts`:
   - `GET /grades/assignments/:assignmentId/template` → `downloadTemplateHandler`, guarded by `roleMiddleware(["teacher"])`.
   - `POST /grades/assignments/:assignmentId/upload` → `uploadGradesHandler`, guarded by `roleMiddleware(["teacher"])`.
   Satisfies **AC-1**, **AC-2**.

5. Write unit tests in `backend/src/__tests__/grade-upload.test.ts` covering: template download contains correct students, successful upload saves grades, ownership denial returns 403, row-level validation errors with correct spreadsheet row numbers in a `success: false` response, atomic rollback on partial failure, file type rejection, file size rejection, idempotent re-upload. Satisfies **AC-1** through **AC-7**.

6. Add two API client helpers in `frontend/react/src/api/apiClient.js`:
   - `downloadGradeTemplate({ assignmentId, academicYear, quarter })`: fetches the template as a blob from `GET /grades/assignments/:assignmentId/template` and triggers a browser file download.
   - `uploadGradeFile({ assignmentId, academicYear, quarter, file })`: posts the file as `FormData` to `POST /grades/assignments/:assignmentId/upload` and returns the parsed response.
   Extend `TeacherGrades.jsx` (the existing grade entry page): add a "Download template" button in the toolbar card (alongside "Apply fill value" and "Copy from previous quarter") that calls `downloadGradeTemplate` with the currently selected assignment, year, and quarter. Add an "Upload grades" file input with an upload button in the same toolbar area. On successful upload, show a success message and re-fetch the roster to reflect the new scores. On validation failure (`success: false`), display the `error.details` array inline as a list of row-level errors (row number + message). Satisfies **AC-9**.

7. Update `context/build-plan.md`: append "20. [ ] Teacher: bulk grade upload via Excel template" after item 19 (the current highest numbered item), and add a progress log entry once the feature is complete. Satisfies **AC-8**.

## Consequences

**Positive**:
- Teachers with unreliable connectivity can enter an entire class of grades offline and upload in a single request.
- No new database tables or migrations — the feature writes to the existing `Grade` model using the existing upsert pattern.
- Atomic writes eliminate ambiguity about partial saves in an offline workflow.
- Row-level error reporting gives actionable feedback with literal spreadsheet row numbers so the teacher can find and fix errors without off-by-one confusion.
- The error response uses the standard `{ success: false, error: { … } }` shape per code-standards.md, keeping the API contract consistent.
- The template is the input contract, so student matching is always by ID (reliable), never by name (fragile).
- multer and ExcelJS are general-purpose infrastructure that can be reused if future features need file uploads or Excel export (e.g., report card export, attendance export).
- The upload UI is integrated into the existing TeacherGrades.jsx page alongside manual entry — teachers have one screen for both workflows.

**Negative / tradeoffs**:
- Two new production dependencies (`exceljs`, `multer`) and one new dev dependency (`@types/multer`) are added to `package.json`. This is the first time the project takes on file upload and Excel parsing infrastructure.
- Atomic semantics mean one bad row blocks the entire upload. Mitigated by clear per-row error reporting and idempotent re-upload (the teacher fixes the bad rows and re-uploads the full file; already-correct rows simply upsert to the same value).
- The 2 MB file size limit is generous for class rosters (typically under 100 KB) but would need revisiting if the feature were extended to multi-class uploads.

**Neutral**:
- No database migration needed.
- No schema changes.
- Existing grade entry UI and API are unaffected — this is an additive feature alongside the existing manual workflow.
