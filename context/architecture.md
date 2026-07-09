# Architecture

## Stack

- **Backend:** Node.js + TypeScript, Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (access token only; refresh tokens are a later improvement, not Phase 1)
- **Frontend:** Next.js + React + TypeScript, UI components migrated from MuStudyHub, Tailwind for styling
- **No BaaS.** No Supabase, Firebase, or similar. This is deliberate — the point of this project is learning to build and own a real backend.

## Repo structure

```
school-system/
  backend/
    src/
      routes/          # Express route definitions only — no business logic here
      controllers/      # request/response handling, calls services
      services/          # business logic, calls Prisma
      middleware/        # auth, role checks, error handler
      prisma/
        schema.prisma
      lib/               # shared utilities (jwt signing, password hashing, etc.)
    .env
  frontend/
    (Next.js app, structure inherited from MuStudyHub where it makes sense)
  context/               # this folder
  CLAUDE.md
```

## Data model (Phase 1)

```
School         (id, name, created_at)

User           (id, school_id, role, name, email, phone, password_hash, created_at)
               role: 'admin' | 'teacher' | 'parent' | 'student'

Student        (id, school_id, class_id, name, dob, created_at)
               No login credentials in Phase 1. If a later phase adds student
               logins, this table gets a nullable, unique user_id — that's a
               future migration, not something to build now.

ParentStudent  (parent_user_id, student_id)
               Many-to-many. Handles siblings and shared custody cases.

Class          (id, school_id, name, teacher_id)

Attendance     (id, student_id, class_id, date, status, marked_by, created_at)
               status: 'present' | 'absent' | 'late'
               Unique constraint on (student_id, date) — a student can't be
               marked twice for the same day.
               marked_by references the teacher User.id who took attendance.
```

## System boundaries — rules the agent must never violate

- **Routes contain no business logic.** A route file wires an HTTP verb + path to a controller function, nothing more.
- **Controllers contain no direct Prisma calls.** Controllers parse/validate the request, call a service, shape the response.
- **Services contain no Express-specific code** (no `req`/`res`). Services take plain arguments, return plain data, or throw typed errors.
- **Role/permission checks happen in middleware**, applied per route, not re-implemented inside individual handlers.
- **A parent can only ever query their own children's data.** Enforced in the service layer every time, based on the authenticated user's ID from the JWT — never trust a student/class ID passed in the request body or params alone.
- **Passwords:** hashed with bcrypt before storage, never logged, never returned in any API response.
- **All config/secrets via `.env`**, loaded once, never hardcoded, never committed.
- **One Prisma client instance**, shared across the app — not instantiated per request.

## Auth flow (Phase 1, kept simple on purpose)

1. Admin creates teacher and parent accounts. No public self-signup in Phase 1 — a school controls who gets an account.
2. Login: email + password, verified against `password_hash`, issues a JWT containing `{ userId, role, schoolId }`.
3. Protected routes read the JWT from the `Authorization` header, verify it, attach the decoded user to `req.user`.
4. Role-checking middleware reads `req.user.role` and allows or blocks per route.
5. JWT is stored in localStorage on the frontend for Phase 1 — simplest to reason about while learning auth from scratch. Moving to an httpOnly cookie is a reasonable hardening step later, not a Phase 1 requirement.
6. No refresh tokens, no password reset flow yet — both are reasonable Phase 2+ additions, not Phase 1 blockers.

## Frontend integration

- The Next.js frontend calls the Express API over REST (`/api/...`), not a BaaS SDK.
- When migrating a MuStudyHub component: strip any `supabase.from(...)` or `supabase.auth...` calls first, then wire it to the equivalent backend endpoint. Don't leave dead Supabase imports in migrated files.
