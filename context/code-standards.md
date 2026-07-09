# Code Standards

## TypeScript

- No `any` unless there's genuinely no better option — prefer explicit types/interfaces.
- Types/interfaces: PascalCase (`AttendanceRecord`, `UserRole`).
- Variables/functions: camelCase.
- One export per file for services/controllers where practical — keeps files easy to find and easy to review.

## File naming

- `kebab-case.ts` for files (`attendance-service.ts`, not `attendanceService.ts`).
- Route files named after the resource: `routes/attendance.ts`, `routes/auth.ts`.

## API response shape

Keep it consistent across every endpoint:

```ts
// success
{ success: true, data: <payload> }

// failure
{ success: false, error: { message: string, code?: string } }
```

## Error handling

- Every route handler wrapped in try/catch, or use a small async-handler wrapper instead of repeating try/catch everywhere.
- Errors thrown from services should be typed/known errors where possible (e.g. a small `AppError` class with a status code) so centralized error-handling middleware can respond correctly instead of leaking a raw stack trace to the client.
- Never return a raw database or Prisma error message directly to the client — log it server-side, return a human-readable message.

## Database access

- All queries through Prisma. No raw SQL unless there's a specific, noted reason (leave a comment explaining why).
- Migrations via `npx prisma migrate dev` — never hand-edit the generated migration SQL.

## Comments

- Comment *why*, not *what* — skip comments that just restate the code.
- Flag any deliberate shortcut with `// TODO(phase-2):` (or the relevant phase) so it's greppable later instead of forgotten.

## Commits

- Small, one logical change per commit.
- Message format: `feat: teacher can mark attendance`, `fix: parent could see other students' attendance`, `chore: add prisma schema`.
