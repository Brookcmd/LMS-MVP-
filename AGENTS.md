# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **LMS** (API base `https://c7q5h4r3.eu-central.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## Stack

* **Language / Runtime**: TypeScript, Node 20
* **Framework**: Express (Backend), React with Vite (Frontend)
* **Database**: Postgres, Prisma ORM
* **Package manager**: npm

## Build approach

Tracer Bullet, vertical end to end slices, thin but complete through every layer

## Commands

```bash
# Backend dev server
cd backend && npm run dev

# Frontend dev server
cd frontend/react && npm run dev

# Run backend unit tests
cd backend && npm test

# Build backend
cd backend && npm run build
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

* Stay inside the current phase in `context/build-plan.md`.
* Backend uses Express, Prisma, and Postgres only.
* Secrets stored in `.env`, never hardcoded or committed.
* Route handlers use try catch blocks and consistent error response shapes.
* Role checks enforced in middleware.
* Parents query only their own children data, verified server side from JWT.

## Context files

* [`context/project-overview.md`](context/project-overview.md): Project goals and scope
* [`context/architecture.md`](context/architecture.md): Stack, folder structure, and data model
* [`context/code-standards.md`](context/code-standards.md): Code structure and conventions
* [`context/build-plan.md`](context/build-plan.md): Feature roadmap and progress log

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._

