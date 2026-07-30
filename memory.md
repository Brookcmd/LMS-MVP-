# Memory — ICT Demo Prep & Project Audit

Last updated: 2026-07-30 1:33 PM (UTC+3)

## What was built

- **Project audit** — assessed Sheba Estudent for ICT department readiness. Found Phase 1 (Foundation) and Phase 2 (MVP) fully checked off, Phase 3 (Grades) mostly built ahead of schedule. No test suite running, no demo seed data, schoolId visible on login form.
- **School ID removed from login** — `frontend/react/src/App.jsx`: School ID field removed from the UI, hardcoded to `12` in state. `backend/src/controllers/auth-controller.ts`: added fallback so login defaults to schoolId `"12"` if not provided in the request body.
- **Demo seed script** — `backend/scripts/seed_demo.ts`: creates 2 teachers (Alemayehu Bekele, Birtukan Tadesse), 2 classes (Grade 10A, Grade 10B), 10 students (5 per class, Ethiopian names), 2 parents linked to children, 3 subjects (Mathematics, English, Science), teaching assignments, today's attendance (3 present, 2 absent per class), and absence notifications. Added `"seed:demo"` script to `backend/package.json`.

## Decisions made

- School ID stays in the database schema (multi-tenancy is good architecture) but is hidden from the login UI for the single-school pilot.
- The demo seed targets school ID 12 (the school the developer has been testing with).
- Grades features exist and work but were built ahead of the build plan (Phase 3 before Phase 2 was proven with a real class).

## Problems solved

- Login friction removed: users no longer need to know or enter a school ID.
- No demo data existed for ICT presentation — now a single command seeds everything needed.

## Current state

- Login form is clean (email + password only, schoolId hardcoded to 12).
- Backend login handler defaults to schoolId 12 if omitted.
- Demo seed script ready at `backend/scripts/seed_demo.ts` — run with `npm run seed:demo` from the backend directory.
- Modified files: `frontend/react/src/App.jsx`, `backend/src/controllers/auth-controller.ts`, `backend/package.json`, `backend/scripts/seed_demo.ts`.
- Grades are built end to end (backend API + frontend pages for teacher and parent) but ahead of schedule per the build plan.

## Next session starts with

- Run `npm run seed:demo` in the backend directory to populate demo data.
- Start the backend (`npm run dev`) and frontend dev server, then visually inspect `/login`, `/`, teacher pages, parent pages, and `/admin` in the browser to catch any spacing or contrast issues from the theme override.
- If the UI looks good, commit the changes (schoolId removal, demo seed, audit findings) separately from the earlier theme/logo work.

## Open questions

- The login left side CSS illustration is still temporary. Replace it with real artwork if the user provides final assets.
- Some pages contain inline style colors from earlier builds; the theme override covers known cases, but a visual pass may reveal any remaining blue or teal accents that should be removed.
- Grades were built ahead of plan — decide whether to keep them in the demo or hide them until Phase 2 is proven with a real class.