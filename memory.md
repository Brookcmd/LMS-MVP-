# Memory — Feature 14 & 16 Verification & Roadmap Reconcile (Course Materials & Submissions)

Last updated: 2026-08-18 08:32 PM (UTC+3)

## What was built

- **Feature 14 — Course Materials Repository**:
  - `backend/prisma/schema.prisma`: `Material` model with `fileUrl`, `fileName`, `fileSize`, `mimeType`, `classId`, `subjectId`, `teacherId`.
  - `backend/src/routes/materials.ts`, `material-controller.ts`, & `material-service.ts`: Endpoints for admin repository (`GET /materials/admin`), teacher upload (`POST /materials`), teacher listing (`GET /materials/teacher`), student/parent class listing (`GET /materials/student`), and class materials (`GET /materials/class/:classId`).
  - `frontend/react/src/pages/CourseMaterials.jsx` & `AdminMaterials.jsx`: Resource filtering by category pills (Lecture Slides, Syllabus, Worksheets, Past Exams, Reference Readings), `FileDropzone.jsx` file upload, in-browser `FilePreviewModal.jsx`, and child switcher.
  - `backend/src/__tests__/materials.test.ts`: 6/6 passing unit tests.

- **Feature 16 — Assignment Submission & Grading Flow**:
  - `backend/prisma/schema.prisma`: `Submission` model with `assessmentId`, `studentId`, `content`, `fileUrl`, `fileName`, `fileSize`, `gradeScore`, `feedback`, `submittedAt`, `gradedAt`, `status`.
  - `backend/src/routes/submissions.ts`, `submission-controller.ts`, & `submission-service.ts`: Homework upload/update (`POST /submissions/assessment/:assessmentId`), view own submission (`GET /submissions/assessment/:assessmentId/my`), teacher roster review (`GET /submissions/assessment/:assessmentId`), and grading (`PATCH /submissions/:submissionId/grade`).
  - `frontend/react/src/pages/ParentDeadlines.jsx` & `TeacherDeadlines.jsx`: Student/parent homework submission modal with status tags (Submitted On-Time, Submitted Late, Graded) and teacher feedback notes; Teacher submissions roster drawer with grade entry (0-100) and feedback saving.
  - `backend/src/__tests__/submissions.test.ts`: End-to-end submission and grading test passed.

- **Build Plan Reconciled**:
  - `context/build-plan.md`: Marked Feature 14 and Feature 16 as completed `[x]` and logged progress entry.

## Decisions made

- **Unified Deadline & Submission Surfaces**: Integrated homework submission modal directly into `ParentDeadlines.jsx` and review/grading drawer into `TeacherDeadlines.jsx` rather than creating separate disjoint pages, keeping parent, student, and teacher workflows streamlined.
- **Support for Multi-Modal Submissions**: Allowed both file attachment (PDF, DOCX, ZIP, image) and text commentary for student submissions.

## Problems solved

- Resolved checklist discrepancy in `context/build-plan.md` where Features 14 and 16 were completely implemented across Prisma, Express, and React, but remained unchecked.
- Verified all 11 backend test suites (63 tests) and frontend production bundle with 0 regressions.

## Current state

- All 63 backend tests across 11 test suites pass with 0 errors.
- Frontend production bundle (`npm run build`) builds cleanly in 1.86s.
- All core LMS features (Phases 1–4 and Phase 5 Features 14, 15, 16, 17, 19, 20, 21, 22, 23) are complete and operational.

## Next session starts with

- Implement Feature 18: Educational Mind-Sharpening Game for students (e.g. math puzzles, memory challenge, speed arithmetic, or vocabulary matching).

## Open questions

- None.