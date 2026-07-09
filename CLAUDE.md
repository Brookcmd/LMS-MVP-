# CLAUDE.md

This file is the entry point. Read it first, every session.

## Project

RollCall — a school attendance tracking system, Phase 1 of a larger school management system idea. See `context/project-overview.md` for what this is, who it's for, and what's explicitly out of scope right now.

See `WORKFLOW.md` for the session-by-session guide on how to actually run each build session using the skills below.

## Read order (before writing any code)

1. `context/project-overview.md` — what we're building, for whom, in/out of scope
2. `context/architecture.md` — stack, folder structure, data model, rules
3. `context/code-standards.md` — naming, conventions, error handling
4. `context/build-plan.md` — the phased feature list and current progress

Confirm you've read all four before implementing anything.

## Rules that never change

- Stay inside the current phase in `build-plan.md`. If a request would pull in a feature from a later phase, say so before building it — don't quietly build it because it seemed related or easy.
- This backend is Express + Prisma + Postgres only. Never introduce Supabase, Firebase, or any other BaaS client or SDK call.
- All secrets in `.env`, never hardcoded. `.env` is gitignored — never commit real credentials.
- Every route handler: try/catch, consistent error response shape (see `code-standards.md`).
- Role/permission checks happen in middleware, not scattered across individual route handlers.
- A parent can only ever query their own children's data — enforced server-side from the JWT, never trusted from a request body or param alone.
- After finishing a feature, update the checklist in `context/build-plan.md`.
- If something breaks and a fix attempt doesn't work, stop and explain what you know and what you've ruled out rather than trying a second unrelated fix.

## Skills (if installed)

Install once per machine:

```
npx skills@latest add JavaScript-Mastery-Pro/skills
```

Select Claude Code when it asks which agent to install for.

- `/architect` — before starting any feature that touches auth, permissions, or more than one table. Skip for pure styling/copy changes.
- `/review` — after a feature is implemented, before moving to the next one.
- `/recover` — when something breaks and the cause isn't obvious after a quick look.
- `/remember` — at the end of every session; `/remember restore` at the start of the next one.
- `/imprint` — after building UI. Not relevant yet — Phase 1 is backend-first.

## Frontend note

UI components are migrated in from an existing project (MuStudyHub) but stripped of their Supabase calls. When touching a migrated component, replace its data-fetching with a call to this backend's API — don't leave dead Supabase imports or calls "just in case."

## Other agents

If Codex, Cursor, or another agent also gets used on this project, copy this file to `AGENTS.md` too (or symlink it) so both read the same instructions.
