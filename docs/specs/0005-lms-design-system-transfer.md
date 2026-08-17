# Spec 0005 — LMS Design System Transfer & UI Modernization Plan

## 1. Overview & Objective

The Sheba University College & Sheba Academy (SUC/SA) landing page established a premium, institutional visual identity (AAU Navy + Sheba Red palette, Outfit & Inter typography, refined elevation, micro-interactions, and full dark-mode support).

Currently, the authenticated LMS application (Parent, Teacher, Student, and Admin portals) uses a legacy CSS styling (`src/styles.css`) characterized by mismatched teal/indigo accents, oversized 24px pill radii, inconsistent card layouts, and lack of unified dark-mode theming.

**Goal**: Systematically transfer the landing page's design decisions, design tokens, typography, and component patterns into the core LMS application without breaking existing functionality, route guards, or state management.

---

## 2. Design System Tokens & Foundations

### 2.1 Color Palette
| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `--navy-primary` | `#0B3861` | `#60A5FA` | Main brand color, active nav items, primary buttons |
| `--navy-deep` | `#071C33` | `#050C1A` | Header backgrounds, dark surfaces, heavy emphasis |
| `--navy-light` | `#184B7A` | `#93C5FD` | Hover states, secondary brand accents |
| `--red-accent` | `#E63946` | `#FF5252` | CTAs, urgency indicators, absent attendance status |
| `--red-accent-light`| `#FF8A8A`| `#FF8A8A` | Subtle badge backgrounds, highlight borders |
| `--bg-canvas` | `#F2F4F6` | `#080F1E` | Main app background behind cards |
| `--bg-surface` | `#FFFFFF` | `#0D172A` | Cards, modals, drawers, dropdown menus |
| `--bg-surface-muted`| `#F0F4F8`| `#132038` | Table headers, secondary blocks, pill containers |
| `--text-heading` | `#0B3861` | `#F8FAFC` | Page titles, major section headers |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Main body copy, table text, input values |
| `--text-secondary`| `#475569` | `#CBD5E1` | Subtitles, labels, descriptions |
| `--text-muted` | `#64748B` | `#94A3B8` | Timestamps, metadata, placeholder text |
| `--border-color` | `#E2E8F0` | `#1E293B` | Card borders, dividers, table cell lines |
| `--border-light` | `#F1F5F9` | `#162032` | Subtle separators, inner boundaries |

### 2.2 Semantic & Status Indicators
| Status | Background Token | Text/Border Token | Usage |
| :--- | :--- | :--- | :--- |
| **Present / Success** | `#D1FAE5` (Dark: `#064E3B`) | `#059669` (Dark: `#34D399`) | Present attendance, passing grades, on-time submissions |
| **Absent / Critical** | `#FEE2E2` (Dark: `#7F1D1D`) | `#DC2626` (Dark: `#F87171`) | Absent attendance, missing assignments, overdue alerts |
| **Late / Warning** | `#FEF3C7` (Dark: `#78350F`) | `#D97706` (Dark: `#FBBF24`) | Late arrivals, upcoming deadline (<24h), pending reviews |
| **Info / Scheduled** | `#DBEAFE` (Dark: `#1E3A8A`) | `#2563EB` (Dark: `#60A5FA`) | Upcoming classes, general notifications, timetable slots |

### 2.3 Typography Scale
- **Headlines & Metric Figures**: `'Outfit', sans-serif` (Weights: 600, 700, 800)
- **Body, UI Controls, Forms, Tables**: `'Inter', -apple-system, sans-serif` (Weights: 400, 500, 600)
- **Scale**:
  - `Display / Page Title`: `clamp(1.5rem, 2.5vw, 2rem)` (Outfit SemiBold)
  - `Section / Card Title`: `1.15rem - 1.25rem` (Outfit SemiBold)
  - `Body Regular`: `0.9375rem (15px)` / `1.5` line-height (Inter Regular)
  - `UI Label / Small`: `0.8125rem (13px)` / `1.4` (Inter Medium)
  - `Micro / Tag`: `0.75rem (12px)` (Inter SemiBold uppercase)

### 2.4 Geometry, Radii & Shadows
- **Containers & Big Panels**: `16px` (`--radius-container`)
- **Cards & Data Modules**: `10px` (`--radius-card`)
- **Buttons & Form Fields**: `6px - 8px` (`--radius-btn`)
- **Tags, Status Badges & Pills**: `4px - 6px` (`--radius-tag`)
- **Shadows**:
  - `Card Base`: `0 2px 8px rgba(11, 56, 97, 0.04), 0 1px 2px rgba(11, 56, 97, 0.06)`
  - `Card Hover`: `0 10px 24px rgba(11, 56, 97, 0.09), 0 2px 6px rgba(11, 56, 97, 0.04)`
  - `Modal / Floating`: `0 20px 48px rgba(7, 28, 51, 0.2)`

---

## 3. Scope of Impact & Component Mapping

```
Existing LMS UI (styles.css)                     Target Design Language (landing.css / tokens)
─────────────────────────────────                ─────────────────────────────────────────────
• Teal (#0d9488) & Purple (#6366f1)        ───►  • Navy (#0B3861) & Red (#E63946)
• 24px Pill-shaped bubbly cards             ───►  • Clean 8px-12px structured institutional cards
• Hardcoded light background (#f7f9fb)      ───►  • Dual-mode CSS variables with smooth dark mode
• Default system sans font                  ───►  • Outfit (headings) + Inter (body & data)
• Flat tables & generic inputs              ───►  • Elevated sticky tables, crisp focus rings
• Cartoonish space login page               ───►  • Institutional SUC/SA portal login with dual hero
• Unstyled mobile bottom nav                ───►  • Frosted glass navigation with active glow
```

### 3.1 Portal Screens to Modernize
1. **Global Chrome**:
   - `TopBar`: Brand crest, user role tag, profile dropdown, notification bell, live theme toggle button.
   - `BottomNav`: Modern icon bar with active indicator badges and smooth tab switching.
   - `Login Screen`: Refined branded portal authentication screen with institutional credentials and clear role guidance.
2. **Parent & Student Portal**:
   - `ParentDashboard`: Student switcher pill, attendance ring summary, recent grades feed, upcoming deadlines list, timetable live widget.
   - `ParentAttendance` / `StudentAttendance`: Calendar view, monthly stats cards, color-coded attendance history table.
   - `ParentGrades` / `StudentGrades`: Subject GPA cards, assignment breakdowns, grading scale modal.
   - `ParentDeadlines` / `StudentDeadlines`: Priority filter tags (Urgent, This Week, Later), submission status indicators.
   - `ParentSchedule` / `StudentSchedule`: Live "Currently in Session" banner, interactive day timeline with room & teacher badges.
3. **Teacher Portal**:
   - `TeacherAttendance`: Quick batch toggle (Mark All Present), fast tap absent/late toggles, save confirmation banner.
   - `TeacherGrades`: Spreadsheet-like grade grid, bulk Excel import/export toolbar, score entry modals.
   - `TeacherDeadlines`: Add assessment modal, class picker, date-time picker, grading category tags.
   - `TeacherSchedule`: Interactive weekly timetable grid with class breakdown.
4. **Admin Portal**:
   - `AdminLayout`: Unified sidebar/topbar with collapsible navigation, school switcher, and breadcrumbs.
   - `AdminDashboard`: Key performance indicators (Total Students, Teachers, Classes, Daily Attendance Rate).
   - CRUD Management Screens (`AdminStudents`, `AdminTeachers`, `AdminClasses`, `AdminSchedule`, `AdminSubjects`, `AdminParentLinks`).
5. **Shared Features**:
   - `Messages`: Two-pane chat interface, message bubbles, timestamp dividers, search input.
   - `Notifications`: Filterable inbox (Unread, Attendance, Academic), dismissible cards.
   - `Profile`: User card, role badge, password change form, notification preferences.

---

## 4. Step-by-Step Implementation Roadmap

### Phase 1: Design Tokens Unification (Non-breaking Foundation)
- [ ] Create `frontend/react/src/styles/tokens.css` containing shared CSS variables for light/dark mode, typography, colors, shadows, and radii.
- [ ] Import `tokens.css` in both `landing.css` and `styles.css`.
- [ ] Ensure font families (`Outfit` and `Inter`) are loaded in `index.html` or root CSS.
- [ ] Verify light/dark theme switching works globally across unauthenticated and authenticated sessions.

### Phase 2: App Shell, Navigation & Login
- [ ] Refactor `TopBar` and `BottomNav` to use brand Navy + Red accents, frosted glass backdrop, and institutional iconography.
- [ ] Overhaul `Login` component to match the institutional brand identity (SUC/SA crest, sleek two-column layout, clear school ID support).
- [ ] Add global theme toggle control in TopBar and Profile.

### Phase 3: Shared UI Component Library
- [ ] Standardize Core Button Styles (`btn-primary`, `btn-secondary`, `btn-accent`, `btn-danger`, `btn-ghost`).
- [ ] Standardize Card Styles (`card-institutional`, `stat-card`, `alert-card`).
- [ ] Standardize Form Controls (inputs, selects, search bars, checkboxes, toggle switches).
- [ ] Standardize Status Badges & Pills (Present, Absent, Late, Quiz, Exam, Assignment).
- [ ] Standardize Modals, Dialogs, and Toast Notifications.

### Phase 4: Parent & Student Portals Overhaul
- [ ] Upgrade `ParentDashboard` with modern KPI widgets, child selector tabs, and activity feed.
- [ ] Modernize `ParentAttendance`, `ParentGrades`, `ParentDeadlines`, and `ParentSchedule`.
- [ ] Ensure full mobile-responsive touch targets and dark-mode contrast compliance.

### Phase 5: Teacher & Admin Portals Overhaul
- [ ] Modernize `TeacherAttendance` batch marking UI with clear feedback states.
- [ ] Modernize `TeacherGrades` and `TeacherDeadlines` management screens.
- [ ] Refactor `AdminLayout` and Admin sub-pages to look like a modern institutional management console.

### Phase 6: Polish, Verification & Accessibility
- [ ] Review WCAG AA color contrast across all light and dark theme components.
- [ ] Add smooth micro-transitions (`var(--transition-smooth)`).
- [ ] Verify all existing automated unit tests and user workflows remain 100% functional.

---

## 5. Verification & Safety Guarantees

1. **Zero Functional Regressions**: All existing API routes, auth tokens, JWT storage, role middleware checks, and data fetch hooks remain untouched.
2. **Backward Compatibility**: Semantic CSS class aliases will be preserved during transition to prevent abrupt layout breaks.
3. **Responsive Quality**: All updated pages tested on Mobile (375px - 430px), Tablet (768px - 1024px), and Desktop (1280px+).
4. **Theme Fidelity**: Zero unstyled flash between dark/light mode transitions.
