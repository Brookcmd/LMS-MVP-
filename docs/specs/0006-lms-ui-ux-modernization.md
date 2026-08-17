# 0006. Modernize LMS User Experience and Interface Aesthetics

**Date**: 2026-08-17
**Status**: Proposed

## Summary

This specification defines the complete user experience and visual aesthetic modernization for the Sheba University College learning management system. It establishes an institutional luxury design language using deep Sheba navy, gold and crimson accents, frosted glass surfaces, and soft elevation shadows across all portals. The changes upgrade parent, student, teacher, and administrator workflows with rich interactive cards, circular progress rings, live ongoing schedule indicators, and instant floating feedback notifications.

## Context

The initial learning management system was created as a functional minimal viable product. The public landing page recently adopted a high end institutional visual identity for Sheba University College and Sheba Academy. The internal portal screens now need to match that aesthetic standard. 

Parents and students require quick visual comprehension of daily attendance, academic progress, and real time class schedules without reading dense text lists. Teachers need rapid single tap attendance workflows and streamlined grade entry. Administrators require clear metric overviews and clean data tables. Without this modernization, the interface would feel disjointed from the public brand and increase cognitive friction for daily school operations.

## Requirements

**User stories**:
- As a parent or student, I want to see a rich dashboard with attendance statistics, ongoing class indicators, and academic progress cards so that I understand my daily school status at a glance.
- As a teacher, I want a fast single tap batch attendance roster and smooth grade management so that taking attendance and managing marks takes minimal classroom time.
- As an administrator, I want an executive analytics dashboard and searchable data tables so that school management is effortless.
- As any authenticated user, I want clear interactive feedback such as floating toast notices, skeleton loading states, and instant theme toggles so that the application feels responsive and polished.

**Acceptance criteria**:
- **AC-1**: The parent dashboard displays an institutional hero greeting banner with active term information, current date, and child switcher pills that update all child specific widgets on tap.
- **AC-2**: The parent dashboard renders a circular SVG attendance progress ring showing overall attendance percentage with color coded segments for present, late, and absent statuses.
- **AC-3**: The schedule view and parent dashboard display a live ongoing class card with a pulsating status beacon indicating the current active period, room number, teacher badge, and countdown to the next period.
- **AC-4**: Academic grade views render summary grade cards with letter badges, visual percentage bars, and course point totals.
- **AC-5**: Teacher attendance view provides a one click mark all present action, instant individual status toggles (present, late, absent), and a live student count summary bar.
- **AC-6**: A global floating toast system provides non intrusive feedback for all save, submit, error, and update actions.
- **AC-7**: Skeleton shimmer loaders display during asynchronous data fetching across dashboards, grades, and rosters.
- **AC-8**: All redesigned components maintain complete visual fidelity, contrast compliance, and theme switching across light and dark modes.

## Options considered

### Option 1: Institutional Academic Luxury (Chosen)
A refined visual identity combining deep Sheba navy (`#0B3861`), subtle gold and crimson accents, frosted glass navigation bars, and soft layered elevation shadows.

**Pros**:
- Perfectly matches the Sheba University College institutional landing page identity.
- Creates an authoritative, premium, and trustworthy academic feel.
- Balances high density educational data with scannable visual hierarchy.

**Cons**:
- Requires careful attention to contrast ratios in dark mode across layered surfaces.

### Option 2: Clean Modern Minimal SaaS
A flat, slate monochromatic interface with high contrast borders and minimal shadows.

**Pros**:
- Simple to build with few visual layers.

**Cons**:
- Feels generic and lacks the unique institutional character of Sheba University College.

### Option 3: Vibrant Playful Interactive
An interface featuring high saturation color blocks, large pill tags, and energetic bouncy animations.

**Pros**:
- High visual excitement.

**Cons**:
- Distracting for faculty and administrative users performing serious daily grading and reporting tasks.

## Decision

**Chosen option**: Option 1: Institutional Academic Luxury

We adopt the Institutional Academic Luxury design language across all LMS portals to deliver a cohesive, premium, and frictionless user experience that matches the Sheba University College institutional brand.

## Feature design

**Component Architecture**:
- `ToastContainer` and `ToastContext`: Global notification toast manager for success, info, warning, and error messages.
- `SkeletonLoader`: Configurable card, table, and list shimmer placeholders.
- `AttendanceRing`: Reusable SVG circular progress component with gradient strokes and animated counter.
- `LiveClassCard`: Real time schedule card calculating active period from system time with pulsating badge.
- `ParentDashboard`: Enhanced modular dashboard integrating hero greeting, child switcher, attendance ring, live class card, and urgent deadline list.
- `TeacherAttendance`: Enhanced roster deck with rapid batch actions and live counter pill.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Parent Dashboard Load | Child attendance percentage and count | Computed from Attendance records in state |
| Live Schedule Card | Current active subject and room | Calculated from ScheduleSlot start and end times against current client time |
| Teacher Attendance Batch | Total present, late, absent count | Real time count derived from roster selection state |
| Grade Card Render | Letter grade and percentage bar | Computed using grade threshold utilities in `gradeUtils.mjs` |
| Toast Trigger | Confirmation message and toast type | Dispatched from action handlers on API success or error |

**Key invariants**:
- Child profile switching must immediately update all dependent widgets without requiring a full page refresh.
- Attendance calculations must correctly handle zero attendance records with a clean empty state.
- Live schedule card must gracefully display a school day ended or no active session message when current time falls outside class hours.
- Dark mode theme tokens must apply consistently across all custom SVG rings and floating toast containers.

**Security model**:
- All UI views strictly enforce client side role guards.
- Parent views only fetch and display records for linked student identifiers verified on the server side.

**Critical test scenarios**:
- Happy path: Parent logs in, sees welcome hero banner, switches child pill, views updated attendance ring and live class card, verifies **AC-1**, **AC-2**, **AC-3**.
- Academic grades flow: User navigates to grades, observes letter badges and progress bars, verifies **AC-4**.
- Teacher rapid attendance flow: Teacher opens class roster, taps mark all present, toggles one student to late, taps submit, receives floating success toast, verifies **AC-5**, **AC-6**.
- Loading and theme flow: User reloads dashboard with simulated network delay, observes skeleton shimmer loaders, toggles theme switch, confirms light and dark styling, verifies **AC-7**, **AC-8**.

## Build plan

1. Create global Toast feedback notification context and component in `frontend/react/src/components/Toast.jsx` and `ToastContext.jsx`, satisfies **AC-6**.
2. Create reusable Skeleton shimmer loader components in `frontend/react/src/components/SkeletonLoader.jsx`, satisfies **AC-7**.
3. Create Attendance circular SVG ring component in `frontend/react/src/components/AttendanceRing.jsx`, satisfies **AC-2**.
4. Create Live ongoing class status component in `frontend/react/src/components/LiveClassCard.jsx`, satisfies **AC-3**.
5. Redesign `ParentDashboard.jsx` incorporating hero banner, child switcher, attendance ring, live class card, and urgent deadlines, satisfies **AC-1**, **AC-2**, **AC-3**.
6. Enhance `ParentGrades.jsx` and `ParentAttendance.jsx` with visual GPA cards, letter badges, and breakdown bars, satisfies **AC-4**.
7. Modernize `TeacherAttendance.jsx` with single tap batch roster deck, live count summary bar, and toast integrations, satisfies **AC-5**, **AC-6**.
8. Verify end to end responsiveness, accessibility contrast, and dark mode transitions across all updated portal screens, satisfies **AC-8**.

## Consequences

**Positive**:
- Elevates the entire user experience to an institutional luxury tier.
- Drastically reduces cognitive load for parents and teachers.
- Unifies the design language between public landing pages and internal application portals.

**Negative / tradeoffs**:
- Requires minor additional component code for real time schedule status calculation and SVG progress math.

**Neutral**:
- No backend database schema changes or API contract changes required.

## Migration plan

**Strategy**: Strangler pattern via modular component replacements.
**Phases**:
1. Implement shared UI primitives (toast engine, skeleton loaders, attendance ring, live schedule card).
2. Upgrade Parent and Student dashboard and portal pages.
3. Upgrade Teacher and Admin portal workflows.
**Rollback**: Standard git commit reversion if any visual defect occurs.
**Risks**: Minor CSS specificity collisions, mitigated by scoping classes to component modules.
