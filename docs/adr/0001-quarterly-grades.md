# ADR 0001: Quarterly grades

**Status**: In Progress

## Summary

The school will record one score from 0 to 100 for every student, subject, quarter, and academic year. Teachers can work only in their assigned subjects and classes. Homeroom teachers can review a full class result, and parents can see saved grades, quarterly averages, and class rank immediately.

## Context

The previous workbook records results by class, subject, quarter, academic year, average, and rank. It contains a large number of linked formula sheets and broken references, which are not suitable as an application data model. The deadline calls for a small, reliable replacement that supports the current grading workflow.

## Requirements

- **AC-1**: An admin can create subjects and assign a teacher to a subject in a class, with a separate homeroom teacher for class result review.
- **AC-2**: An assigned teacher can create and update a whole class of quarterly scores from 0 to 100 for only their assigned subject and class.
- **AC-3**: A parent can view only their linked child's saved grades, quarterly subject scores, overall average, and class rank for an academic year and quarter.
- **AC-4**: The API rejects invalid scores, invalid quarter values, cross school data, and grade writes by an unassigned teacher.

## Options considered

### Option 1: Store grades as free text subject labels

This is the quickest approach but it cannot reliably restrict teachers to their own subjects or compute class level results.

**Pros**: Fast to add.

**Cons**: Weak permissions and inconsistent subject names.

### Option 2: Subjects with teacher class assignments

Subjects are school records, and a teaching assignment links one teacher, one subject, and one class. Grades refer to the assignment.

**Pros**: Supports correct permissions, reporting, and multiple classes or subjects per teacher.

**Cons**: Requires admin setup before grade entry.

## Decision

**Chosen option**: Option 2: Subjects with teacher class assignments.

Grades are stored against the student and an assigned teacher, subject, and class combination. Results are calculated when read rather than stored as totals, averages, or ranks.

## Rationale

The class teacher model in the existing app does not identify a subject. A dedicated assignment is the smallest reliable way to ensure that every instructor can enter grades only for their own students and subjects. Computing aggregates at read time avoids stale summary values and replaces fragile spreadsheet formulas.

## Feature design

**Data model sketch**:

| Entity | Fields and relationships |
|---|---|
| Subject | `id`, `schoolId`, `name`, `createdAt`. Unique `schoolId`, `name`. |
| TeachingAssignment | `classId`, `teacherId`, `subjectId`. Unique `classId`, `teacherId`, `subjectId`. |
| Class | Add nullable `homeroomTeacherId`, referencing `User`. A homeroom teacher reviews but does not write other subject grades. |
| Grade | `id`, `studentId`, `teachingAssignmentId`, `academicYear`, `quarter`, `score`, `createdAt`, `updatedAt`. Unique `studentId`, `teachingAssignmentId`, `academicYear`, `quarter`. |

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/subjects` | POST | `name` | subject | admin | 400, 409 |
| `/subjects` | GET | pagination | subjects | admin | 401 |
| `/teaching-assignments` | POST | `classId`, `teacherId`, `subjectId` | assignment | admin | 400, 409 |
| `/grades/assignment/:assignmentId` | GET | `academicYear`, `quarter` | roster and scores | assigned teacher | 403, 404 |
| `/grades/assignment/:assignmentId` | PUT | `academicYear`, `quarter`, `grades[]` | created and updated counts | assigned teacher | 400, 403 |
| `/classes/:classId/results` | GET | `academicYear`, `quarter` | grades, averages, ranks | homeroom teacher | 403, 404 |
| `/parent/grades` | GET | `studentId`, `academicYear`, `quarter` | subject scores, average, rank | parent | 400, 404 |

**Key invariants**:

- Scores are integer values from 0 through 100.
- Quarters are 1 through 4.
- The grade student must belong to the assignment class.
- The assigned teacher is the only grade writer.
- Every query is constrained to the authenticated user's school.
- A rank is calculated from the average across subjects that have a score for the selected quarter. Equal averages receive the same rank.

**Security model**:

Admins manage subjects and teaching assignments. Teachers read and write only grades for their own teaching assignments. Homeroom teachers can read only class results for classes they manage. Parents can read only linked children. Student logins remain out of scope.

**Critical test scenarios**:

- Happy path: an assigned teacher saves scores for a class and a linked parent sees the subject scores, average, and rank, verifies **AC-2**, **AC-3**.
- Failure case: a score outside 0 through 100 and a duplicate retry are rejected or safely upserted, verifies **AC-2**, **AC-4**.
- Auth and permission: an unassigned teacher, non homeroom teacher, and unrelated parent are denied, verifies **AC-3**, **AC-4**.

## Build plan

1. Add the subject, teaching assignment, homeroom teacher, and grade schema migration, satisfies **AC-1**, **AC-4**.
2. Add admin subject and teaching assignment services, controllers, and routes, satisfies **AC-1**.
3. Add teacher grade roster and batch upsert APIs with assignment validation, satisfies **AC-2**, **AC-4**.
4. Add parent and homeroom result APIs with calculated averages and ranks, satisfies **AC-3**, **AC-4**.
5. Add teacher entry, parent grades, and homeroom review screens, satisfies **AC-2**, **AC-3**.
6. Add tests for permissions, validation, parent ownership, aggregates, and grade upserts, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.

## Consequences

**Positive**:

- Teachers have strict subject and class boundaries.
- Parents receive results without a manual report card process.
- Averages and ranks cannot become stale.

**Negative / tradeoffs**:

- Administrators must configure subjects and teaching assignments.
- Results use only currently saved subject grades for a quarter.

## Follow-up

- [ ] Add report card export only after the core grade workflow is proven.
- [ ] Add term and annual calculations after the four quarter workflow is complete.
