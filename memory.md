# Memory — Admin auth setup and Bruno guide

Last updated: 2026-07-29 00:00:00 +00:00

## What was built

- Added a Bruno usage guide at [BRUNO_GUIDE.md](BRUNO_GUIDE.md) for logging in as the seeded admin and creating teacher/parent accounts.
- Verified the backend auth flow for the seeded admin account.
- Confirmed the admin login endpoint works with:
  - email: admin@testschool.com
  - password: Admin@123
- Fixed the frontend Vite proxy target so browser requests reach the backend on port 5200 instead of the old 5000 target.

## Decisions made

- Keep the Bruno guide focused on the real backend contract: POST /auth/login for admin sign-in and POST /auth/signup for teacher/parent creation.
- Use the backend’s actual port 5200 in the frontend proxy configuration to match the running dev server.

## Problems solved

- Resolved the earlier admin login failure caused by the missing seeded admin user.
- Resolved the frontend fetch issue by correcting the Vite proxy target so /api requests reach the running backend.

## Current state

- The seeded admin user exists and can log in successfully.
- The backend auth endpoint is available at http://localhost:5200/auth/login.
- The React frontend now proxies /api requests to the backend correctly.
- The Bruno guide is available in the project root for manual API testing.

## Next session starts with

- Use the admin token from the successful login to create teacher and parent accounts through POST /auth/signup.
- If the frontend still shows login issues in the browser, inspect the browser network tab and the app’s auth state handling.

## Open questions

- Whether the frontend login page should also display a clearer error when the backend returns a non-200 auth failure.
