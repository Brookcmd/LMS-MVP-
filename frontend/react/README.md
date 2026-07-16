# RollCall React Frontend (mock)

This is a minimal React + Vite app to demo the screens with a simple mock API and mock auth.

Run locally:

```bash
cd frontend/react
npm install
npm run dev
```

Visit http://localhost:5173, click "Mock Login" and choose a role (`parent` or `teacher`).

Notes:
- The app uses a simple client-side mock API (`src/api/mockApi.js`) so you can test screens without running the backend.
- To test against the real backend, replace calls in the pages to call your backend endpoints and ensure authentication is available.
