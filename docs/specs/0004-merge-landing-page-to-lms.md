# 0004. Merge Landing Page into LMS Frontend

**Date**: 2026-08-12
**Status**: Proposed

## Summary

This specification defines how to integrate the standalone landing page codebase into the main React LMS application. The merged landing page will serve as the root page for public visitors while maintaining clean routing for authenticated users. All landing page components, assets, and styling will be organized in isolated modules within the frontend workspace to prevent style bleed or build issues. A lightweight backend API endpoint will handle public contact form submissions from the landing page.

## Context

The repository currently contains a separate `landingpage` directory alongside `frontend/react` and `backend`. Operating two distinct Vite frontend builds creates unnecessary deployment complexity, duplicate dependencies, and inconsistent user routing. Unauthenticated visitors to the main LMS domain currently hit the login screen rather than a proper institutional homepage. Merging the landing page into `frontend/react` consolidates the client codebase into a single Vite application, improves public presentation, and simplifies routing between public marketing content and LMS features.

## Requirements

**User stories**:
- As a public visitor, I want to view the institutional landing page at the root URL so that I can learn about academic programs, campus life, faculty, and tuition estimates.
- As a public visitor, I want to submit inquiries via the contact form so that the university administration can respond to my questions.
- As a student or teacher, I want a clear path to log in from the landing page, and automatic redirection to my dashboard if I am already authenticated.

**Acceptance criteria**:
- **AC-1**: Unauthenticated visitors navigating to the root path `/` see the institutional landing page with full navigation header, hero slider, program overview, and footer.
- **AC-2**: Authenticated users with valid session tokens accessing the root path `/` are automatically redirected to their role dashboard (`/student/dashboard`, `/teacher/dashboard`, etc.).
- **AC-3**: Clicking the Login button on the landing page header navigates the user to `/login`.
- **AC-4**: Contact form submissions send a JSON payload via `POST /api/contact` to the Express backend and display a clear confirmation or error message to the visitor.
- **AC-5**: Landing page UI components are scoped in `src/components/landing/`, views in `src/pages/LandingPage.jsx`, and styles in `src/styles/landing.css` to prevent CSS rule leakage into LMS dashboard views.
- **AC-6**: The standalone `landingpage/` folder at the repository root is deleted after the integrated landing page passes verification.

## Options considered

### Option 1: Integrated Component Directory and Root Route Strangler

Migrate all React components from `landingpage/src/components/` into `frontend/react/src/components/landing/`, move styles to `src/styles/landing.css`, and create `src/pages/LandingPage.jsx`. Update `App.jsx` router so `/` renders `LandingPage.jsx` when unauthenticated or redirects when authenticated. Add a lightweight Express route handler for contact form submissions.

**Pros**:
- Single Vite build and single React router for the entire project
- Zero extra deployment steps or subdomains
- Smooth transition between landing page and login flow

**Cons**:
- Requires careful CSS scoping to prevent landing page global styles from affecting LMS dashboard components

### Option 2: Separate Monorepo Subpackage with Independent Build

Keep landing page in `frontend/landing` as a distinct Vite project in an npm workspace monorepo setup, outputting to a subfolder during build.

**Pros**:
- Strict build isolation between landing page and LMS portal

**Cons**:
- Adds build tool complexity and multiple Vite dev servers
- Cross page navigation requires full page reloads rather than React Router transitions

## Decision

**Chosen option**: Option 1: Integrated Component Directory and Root Route Strangler

The landing page will be fully integrated into `frontend/react` as a first class page view with modular components and isolated styles. A simple backend controller will handle public contact inquiries.

## Rationale

Integrating the landing page directly into the main React application provides the cleanest developer experience and user experience. Visitors can navigate smoothly from marketing content to the login screen without full browser reloads. Maintaining a single Vite configuration avoids build script duplication and keeps dependency management straightforward. Style leakage risks are mitigated by scoping landing page CSS classes under a dedicated container class or standalone file.

## Feature design

**Data model sketch**:
Contact inquiries will be stored in Postgres or logged via backend notification service:
- `ContactSubmission` entity: `id` (uuid, req), `name` (string, req), `email` (string, req), `phone` (string, optional), `subject` (string, optional), `message` (text, req), `createdAt` (datetime, req).

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/contact | POST | name (req), email (req), message (req), phone, subject | id, message | public | 400 (validation), 500 (server) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| View landing page | Academic programs, faculty list, tuition rates | Hardcoded JSON data objects in `src/data/landingData.js` |
| Submit contact form | Success toast notification | Response status from `POST /api/contact` |
| Click login link | Navigation to login view | `react-router-dom` navigate to `/login` |
| Root route access | Render landing page or redirect | Check JWT token existence in local storage |

**Key invariants**:
- Unauthenticated users must always be able to view the landing page without authentication errors.
- Existing LMS portal routes (`/login`, `/student/*`, `/teacher/*`, `/admin/*`) must remain fully functional without visual or route regression.

**Security model**:
- `POST /api/contact` is a public endpoint with input sanitization and rate limiting middleware to prevent spam abuse.
- No sensitive user data is exposed on public landing page routes.

**Configuration required**:
- No new environment variables required.

**Critical test scenarios**:
- Happy path: Unauthenticated user visits `/`, sees landing page, clicks Login, lands on `/login`, satisfies **AC-1**, **AC-3**
- Authentication redirect: User logged in as student visits `/`, automatically redirected to `/student/dashboard`, satisfies **AC-2**
- Contact form submission: Visitor fills contact form and submits, receives success feedback, satisfies **AC-4**
- Visual isolation: Inspect LMS dashboard elements to confirm no font or background style regressions from landing page CSS, satisfies **AC-5**

## Build plan

1. Copy landing page assets (images, icons) from `landingpage/public` and `landingpage/src/assets` into `frontend/react/public/landing/` and `frontend/react/src/assets/landing/`, satisfies **AC-5**
2. Migrate React components from `landingpage/src/components/` into `frontend/react/src/components/landing/` and create data file `frontend/react/src/data/landingData.js`, satisfies **AC-5**
3. Create `frontend/react/src/styles/landing.css` containing scoped styles for landing page components, satisfies **AC-5**
4. Create `frontend/react/src/pages/LandingPage.jsx` assembling header, hero, features, tuition estimator, faculty directory, contact floating modal, and footer, satisfies **AC-1**, **AC-5**
5. Update `frontend/react/src/App.jsx` routes to set `/` as `LandingPage` with session check redirect for logged in users, satisfies **AC-1**, **AC-2**, **AC-3**
6. Implement `POST /api/contact` route and controller in Express backend, satisfies **AC-4**
7. Connect contact form component in `frontend/react/src/components/landing/` to trigger `POST /api/contact`, satisfies **AC-4**
8. Run manual and automated verification tests across landing page and portal routes, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**
9. Remove the legacy `landingpage/` folder from project root, satisfies **AC-6**

## Migration plan

**Strategy**: Strangler integration within single repository commit batch
**Phases**:
1. Add landing page components, page view, styles, and routes to `frontend/react`.
2. Implement backend `/api/contact` endpoint.
3. Test all routes end to end.
4. Remove legacy `landingpage/` directory.
**Rollback**: If integration causes issues, revert the router change in `App.jsx` to preserve existing portal functionality while debugging.
**Risks**: CSS style collisions if selectors are not properly scoped under `.landing-page-container` parent wrapper.

## Consequences

**Positive**:
- Single unified frontend repository structure and build output
- Professional institutional entry point for unauthenticated visitors
- Centralized dependency management in `frontend/react/package.json`

**Negative / tradeoffs**:
- Slightly increased bundle size for `frontend/react`, though lazy loading `LandingPage.jsx` mitigates initial load cost

**Neutral**:
- Requires updating dev environment docs to reference `cd frontend/react && npm run dev` only

## Follow-up

- [ ] Add rate limiting middleware to `POST /api/contact` in production
- [ ] Consider connecting faculty directory and news section to backend CMS database tables in a future iteration
