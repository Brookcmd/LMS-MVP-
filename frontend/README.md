# Frontend demo

This folder contains a minimal mobile-first notifications demo for RollCall.

How to use

- Start the backend server (the Express app) so the endpoints are available. The demo calls:
  - `GET /parent/notifications`
  - `PATCH /parent/notifications/:notificationId/read`

- Open `frontend/notifications.html` in a browser. The demo will attempt to use `credentials: include` for auth; if your backend uses cookies or a session, sign in first.

Notes

- This is a lightweight static demo, intended to be integrated into your preferred frontend framework.
- If the backend is not running or returns 401, the demo shows an unauthorized message.
