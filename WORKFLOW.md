# Workflow Guide — How to Actually Build This

This is the practical, session-by-session version of the JS Mastery workflow, adapted to this project. `CLAUDE.md` and `context/` are what the agent reads. This file is for you — the loop to follow while you're actually sitting down to build.

## The loop (repeat for every feature)

1. **New session (new chat) per feature.** Keeps context focused instead of dragging every prior conversation along.
2. **Start:** `remember restore` (for the very first session ever, instead say: "Read CLAUDE.md and follow the reading order specified. Confirm once you've read all four context files and are ready to build.")
3. **Plan first, for anything non-trivial.** If the feature touches auth, permissions, more than one table, or real business logic, run `architect feature N` before letting it write code. Read the plan it gives back — you're allowed to reject or edit a step, not just approve everything.
4. **Implement.**
5. **Test it yourself** — in the browser, or with a real request (curl/Postman/Thunder Client). Don't take "done" at face value; the video's first attempt at almost every real feature needed at least one fix.
6. **Run `review`.** Read what it flags and decide what's worth fixing now versus noting for later.
7. **If it's a UI feature, run `imprint`** so the component patterns get captured for reuse on the next screen. Not relevant until Phase 2.
8. **End: `remember save`** before closing the session.
9. **If something breaks and you're stuck, run `recover`** — and paste the actual error message or terminal output, not just "it doesn't work." The more specific the input, the better it diagnoses.

## One-time setup (before Feature 1)

- [ ] `npm init`, install Express, TypeScript, Prisma, bcrypt, jsonwebtoken, dotenv
- [ ] `npx skills@latest add JavaScript-Mastery-Pro/skills` → select Claude Code when asked
- [ ] Confirm `CLAUDE.md` and `context/` sit at the repo root
- [ ] Set up a Postgres database — local via Docker, or a free-tier hosted one (Neon, Railway, etc.) — and put the connection string in `.env`
- [ ] `.gitignore`: `node_modules`, `.env`, `dist`
- [ ] First prompt: "Read CLAUDE.md and follow the reading order specified. Confirm once you've read all four context files and are ready to build."

## Design references (optional, but it reduces back-and-forth)

The video fed the agent a PNG of each screen before building it, so it matched a real layout instead of guessing blind. You can do the same per screen:

- Generate a rough mockup (Stitch, or reuse a close-fitting MuStudyHub screen) for: login, teacher attendance view, parent attendance view, admin class/student management
- Drop them in `context/designs/`
- Reference them directly: "build the teacher attendance screen exactly as shown in context/designs/teacher-attendance.png"

Skipping this is fine too — the agent builds from your written description instead — just expect more rounds of layout correction.

## Session map for this project

| Feature (see `build-plan.md`) | Run `architect` first? | Notes |
|---|---|---|
| 1. Project scaffold | No | Pure setup, nothing to decide |
| 2. Prisma schema | Yes | Check the plan against `architecture.md`'s data model before saying implement |
| 3. Auth (signup/login/JWT) | Yes | Highest-risk feature to get wrong — read the plan carefully |
| 4. Role middleware | Optional | Fine to fold into the same session as #3 |
| 5. Admin CRUD (classes/students/teachers/links) | Yes | Several related endpoints touching the same tables |
| 6. Teacher marks attendance | Optional | Consider the UI-first-then-logic split below if it feels like a lot at once |
| 7. Parent views attendance | Optional | Same split option |
| 8. Absence notification | No | Small, single session |
| 9–17 | Don't plan in detail yet | `build-plan.md` is explicit: don't start Phase 3 until Phase 2 is actually used by a real class. Revisit this table then. |

Run `imprint` on any feature that includes real UI (6 onward) — Phase 1 is API-only, so it won't come up there.

## UI-first, then logic

For anything with both a real interface and real backend logic (attendance marking, attendance history), splitting into two sessions works well for a beginner:

1. **Session A:** "Build the [screen] UI with mock/hardcoded data, no real save or fetch logic yet."
2. **Session B:** "Wire the [screen] up to the real API — replace the mock data with real requests."

This way you can confirm the interface looks right before also debugging data flow on top of it.

## Things that went wrong in the video, worth expecting here too

- An agent's knowledge of library APIs can be stale. If something about Express, Prisma, or a package looks off, say so and ask it to check current docs rather than assuming its first instinct is right.
- After any `.env` change, restart the dev server before testing again — a running process won't pick up new environment variables on its own.
- Run the actual start/build command before calling a feature "done," not just a visual check in the browser — some errors only surface at compile or build time.
- A first fix isn't always the right one. If `review` or `recover`'s first attempt doesn't work, push back with the actual error output and ask it to verify its own claim rather than accepting a second guess automatically.
- Expect the first pass at any non-trivial feature to need at least one correction. That's normal, not a sign the workflow isn't working.

## What's different from the video, on purpose

- No InsForge, Browserbase, Adzuna, or PostHog — none of it applies here. If the agent ever suggests reaching for a BaaS "to move faster," that's a cue to re-read `CLAUDE.md`, not a suggestion to take.
- Four context files instead of nine, because this project's Phase 1–2 scope is a small fraction of Job Pilot's 25-feature build. Add a new context file only when you catch yourself re-explaining the same thing across sessions — that repetition is the signal it would pay for itself.
