# Sheba Estudent

**Sheba Estudent** is a school management platform built for real schools — starting with attendance visibility for parents and fast daily roll call for teachers. It is designed as a phased product: a solid attendance MVP first, then grades, deadlines, and broader LMS features over time.

Built for a single-school pilot (with room to generalize later), the stack is a custom **Express + Prisma + PostgreSQL** backend and a **React (Vite)** frontend — no BaaS, no Supabase.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Who it's for](#who-its-for)
- [Features by role](#features-by-role)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Running in development](#running-in-development)
- [Default accounts (seed)](#default-accounts-seed)
- [User workflows](#user-workflows)
- [Frontend routes](#frontend-routes)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Authentication](#authentication)
- [Testing](#testing)
- [Building for production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Project phases & roadmap](#project-phases--roadmap)
- [Development guidelines](#development-guidelines)
- [Related documentation](#related-documentation)
- [License](#license)

---

## Why this exists

School attendance is often tracked manually — on paper or informally — and parents frequently learn about absences days or weeks late. **Sheba Estudent** closes that gap by giving teachers a quick way to mark attendance and giving parents same-day visibility (plus notifications when a child is marked absent).

The long-term vision is a broader school management system; the current codebase deliberately focuses on what one real class needs first.

---

## Who it's for

| Role | Purpose |
|------|---------|
| **Admin** | Set up the school: classes, students, teacher/parent accounts, subjects, teaching assignments, and parent–student links |
| **Teacher** | Mark daily attendance; enter and view grades for assigned subjects |
| **Parent** | View linked children's attendance history, grades, and absence notifications |
| **Student** | In the data model for future phases; no student login UI yet |

---

## Features by role

### Admin (`/admin`)

- Dashboard with live counts (classes, students, teachers, subjects)
- **Classes** — create, edit, delete; assign multiple teachers per class
- **Students** — enroll students (name, class, date of birth); edit and remove records
- **Teachers / Parents** — create login accounts via admin-only signup
- **Subjects & assignments** — manage subject catalog and link teacher + subject + class
- **Parent links** — connect parent accounts to student records

### Teacher (`/teacher`)

- Select a class and date; batch-mark attendance as **present**, **absent**, or **late**
- Mark attendance for today or up to 7 days in the past
- Enter quarterly grades per teaching assignment (`/teacher/grades`)

### Parent (`/`)

- Parent dashboard with linked children
- Attendance history with calendar view (`/attendance`)
- Grade reports per child (`/grades`)
- In-app absence notifications (`/notifications`)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | JWT (bcrypt password hashing) |
| Frontend | React 18, React Router, Vite |
| Testing | Vitest, Supertest |

---

## Repository structure

```text
LMS-MVP-/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Data model
│   │   ├── migrations/        # SQL migrations
│   │   └── seed.ts            # Initial admin + school
│   ├── src/
│   │   ├── routes/            # HTTP route definitions
│   │   ├── controllers/       # Request/response handling
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, roles, errors
│   │   └── lib/               # JWT, Prisma client, errors
│   └── .env                   # Backend secrets (not committed)
├── frontend/
│   └── react/                 # Main React app (Vite)
│       ├── src/
│       │   ├── pages/         # Role-specific pages
│       │   ├── pages/admin/   # Admin portal
│       │   ├── api/           # API client
│       │   └── auth/          # Auth context
│       └── vite.config.js     # Dev server + API proxy
├── context/                   # Product & architecture docs
├── screens/                   # UI design references (HTML mocks)
├── API_test/                  # Bruno / OpenCollection API tests
├── BRUNO_GUIDE.md             # Manual API testing guide
└── README.md                  # This file
```

---

## Prerequisites

Install before you begin:

- **Node.js** 18+ (20+ recommended)
- **npm** 9+
- **PostgreSQL** 14+ (local instance or hosted)
- **Git**

Optional:

- [Bruno](https://www.usebruno.com/) or similar for API testing (`BRUNO_GUIDE.md`)

---

## Quick start

### 1. Clone and install

```bash
git clone <repository-url>
cd LMS-MVP-

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend/react
npm install
```

### 2. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sheba_estudent
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRY=86400
PORT=5200
```

> **Important:** Never commit `.env`. It is gitignored.

### 3. Prepare the database

From the **repository root** (where `prisma.config.ts` lives):

```bash
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
```

Or from `backend/`:

```bash
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
```

### 4. Start backend and frontend

**Terminal 1 — backend** (port **5200**):

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend** (port **5201**, proxies `/api` → backend):

```bash
cd frontend/react
npm run dev
```

### 5. Open the app

| URL | Purpose |
|-----|---------|
| http://127.0.0.1:5201 | React frontend |
| http://127.0.0.1:5200/health | Backend health check |

Log in with the seeded admin account (see [Default accounts](#default-accounts-seed)), then set up teachers, parents, classes, and students from the admin portal.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWTs |
| `JWT_EXPIRY` | No | Token lifetime in seconds (default: 86400 = 24h) |
| `PORT` | No | HTTP port (default: 5000; use **5200** for frontend proxy) |

### Frontend (`frontend/react/.env.local`, optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL. Leave default in dev — Vite proxies to backend |

---

## Database setup

### Migrations

```bash
# Apply pending migrations (development)
npx prisma migrate dev

# Reset database (destructive — dev only)
npx prisma migrate reset
```

### Seed

The seed script creates:

- A school named **Sheba Estudent**
- An admin user (see below)

```bash
npm run prisma:seed
```

### Prisma Studio (optional)

Inspect data visually:

```bash
npx prisma studio
```

---

## Running in development

| Service | Command | URL |
|---------|---------|-----|
| Backend | `cd backend && npm run dev` | http://127.0.0.1:5200 |
| Frontend | `cd frontend/react && npm run dev` | http://127.0.0.1:5201 |

The Vite dev server proxies browser requests from `/api/*` to `http://127.0.0.1:5200/*`, so the frontend can call the API without CORS configuration during local development.

---

## Default accounts (seed)

After seeding, use these credentials on the login page (School ID = school record ID, usually `1`):

| Field | Value |
|-------|-------|
| School ID | `1` |
| Email | `admin@testschool.com` |
| Password | `Admin@123` |

> Change these credentials before any production deployment.

Teachers and parents are **not** seeded — create them from **Admin → Teachers** and **Admin → Parents**, then link parents to students on **Admin → Parent Links**.

---

## User workflows

### Admin setup (recommended order)

1. Log in as admin → `/admin`
2. **Teachers** — create teacher accounts
3. **Parents** — create parent accounts
4. **Classes** — create classes and assign teachers
5. **Students** — enroll students into classes
6. **Parent Links** — link each parent to their child(ren)
7. **Subjects** — add subjects and teaching assignments (teacher + subject + class)

### Teacher daily attendance

1. Log in as teacher → `/teacher`
2. Select class and date
3. Mark each student present / absent / late
4. Submit batch — parents of absent students receive notifications

### Parent check-in

1. Log in as parent → dashboard
2. Open **Attendance** for history or **Grades** for report cards
3. Check **Notifications** for absence alerts

---

## Frontend routes

| Path | Role | Description |
|------|------|-------------|
| `/login` | Public | Sign in (school ID + email + password) |
| `/admin` | Admin | Dashboard overview |
| `/admin/classes` | Admin | Class management |
| `/admin/students` | Admin | Student enrollment |
| `/admin/teachers` | Admin | Teacher accounts |
| `/admin/parents` | Admin | Parent accounts |
| `/admin/subjects` | Admin | Subjects & teaching assignments |
| `/admin/parent-links` | Admin | Parent–student links |
| `/teacher` | Teacher | Attendance marking |
| `/teacher/grades` | Teacher | Grade entry |
| `/` | Parent | Parent dashboard |
| `/attendance` | Parent | Attendance history |
| `/grades` | Parent | Child grade reports |
| `/notifications` | Parent | Absence notifications |
| `/profile` | Any | User profile |

---

## API reference

Base URL (local): `http://127.0.0.1:5200`

All protected routes require:

```http
Authorization: Bearer <jwt_token>
```

Responses follow a consistent shape:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "...", "code": "..." } }
```

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Service health check |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login; returns `{ user, token }` |
| POST | `/auth/signup` | Admin | Create teacher or parent account |

**Login body:**

```json
{
  "schoolId": "1",
  "email": "user@school.edu",
  "password": "your-password"
}
```

**Signup body (admin only):**

```json
{
  "name": "Jane Teacher",
  "email": "jane@school.edu",
  "password": "temporary-password",
  "role": "teacher"
}
```

`role` must be `"teacher"` or `"parent"`.

### Admin — classes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/classes` | List all classes |
| POST | `/classes` | Create class `{ name, teacherIds? }` |
| GET | `/classes/:classId` | Get one class |
| PUT | `/classes/:classId` | Update class |
| DELETE | `/classes/:classId` | Delete class |

### Admin — students

| Method | Path | Description |
|--------|------|-------------|
| GET | `/students` | List students |
| POST | `/students` | Create `{ name, classId, dob? }` |
| GET | `/students/:studentId` | Get student |
| PUT | `/students/:studentId` | Update student |
| DELETE | `/students/:studentId` | Delete student |

### Admin — teachers & parents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teachers` | List teachers |
| GET | `/teachers/:teacherId` | Get teacher |
| GET | `/parents` | List parents |

### Admin — parent–student links

| Method | Path | Description |
|--------|------|-------------|
| GET | `/parent-students` | List all links |
| POST | `/parent-students` | Upsert link `{ parentUserId, studentId, relationship?, isPrimary? }` |
| DELETE | `/parent-students/:parentUserId/:studentId` | Remove link |

### Admin — grades & curriculum

| Method | Path | Description |
|--------|------|-------------|
| GET | `/grades/subjects` | List subjects |
| POST | `/grades/subjects` | Create subject `{ name }` |
| GET | `/grades/teaching-assignments` | List all assignments (admin) |
| POST | `/grades/teaching-assignments` | Create `{ classId, teacherId, subjectId }` |

### Teacher — attendance

| Method | Path | Description |
|--------|------|-------------|
| POST | `/attendance/batch` | Batch upsert `{ classId, date, marks: [{ studentId, status }] }` |
| GET | `/attendance?classId=&date=` | Get attendance for class/date |

`status`: `"present"` | `"absent"` | `"late"`

### Teacher — grades

| Method | Path | Description |
|--------|------|-------------|
| GET | `/grades/teaching-assignments/mine` | Teacher's assignments |
| GET | `/grades/assignments/:assignmentId?academicYear=2025/26&quarter=1` | Grade roster |
| PUT | `/grades/assignments/:assignmentId` | Save grades `{ academicYear, quarter, grades: [{ studentId, score }] }` |
| GET | `/grades/classes/:classId/results?academicYear=&quarter=` | Homeroom results |

`academicYear` format: `YYYY/YY` (e.g. `2025/26`). `quarter`: 1–4.

### Parent

| Method | Path | Description |
|--------|------|-------------|
| GET | `/parent/students` | List linked children |
| GET | `/parent/attendance?studentId=&from=&to=` | Attendance history (max 180-day range) |
| GET | `/parent/notifications` | List absence notifications |
| PATCH | `/parent/notifications/:notificationId/read` | Mark notification read |
| GET | `/grades/parent?studentId=&academicYear=&quarter=` | Child grade report |

---

## Data model

Core entities (see `backend/prisma/schema.prisma` for full schema):

```text
School
  └── User (admin | teacher | parent | student)
  └── Class
        └── ClassTeacher (many teachers per class)
        └── Student
        └── TeachingAssignment (teacher + subject + class)
        └── Attendance
  └── Subject
  └── ParentStudent (parent User ↔ Student)
  └── Grade (per student, assignment, academic year, quarter)
  └── Notification (absence alerts to parents)
```

**Important distinctions:**

- **Students** are enrollment records (name, class, DOB) — not login accounts in the current phase.
- **Teachers and parents** are `User` records with credentials, created by admin via signup.
- A parent can only access data for children linked through `ParentStudent` (enforced server-side from JWT, never from request body alone).

---

## Authentication

1. Admin creates teacher/parent accounts — no public self-registration.
2. Login with school ID + email + password → JWT containing `{ userId, role, schoolId }`.
3. Frontend stores JWT in `localStorage` and sends it as `Authorization: Bearer …`.
4. Role middleware guards routes (`admin`, `teacher`, `parent`).
5. JWT expires after 24 hours by default (`JWT_EXPIRY`).

---

## Testing

Run backend tests from the repository root:

```bash
npm test
```

Or from `backend/`:

```bash
npm test
```

Tests use Vitest + Supertest against the Express app with a test database configuration (`backend/.env.test`).

---

## Building for production

**Backend:**

```bash
cd backend
npm run build    # compiles TypeScript to dist/
npm start        # runs dist/index.js
```

**Frontend:**

```bash
cd frontend/react
npm run build    # outputs to dist/
npm run preview  # local preview of production build
```

Serve the frontend `dist/` with any static host. Set `VITE_API_URL` to your production API URL at build time if the API is on a different origin.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Frontend API calls fail | Backend not running or wrong port | Start backend on **5200**; check `vite.config.js` proxy |
| `401 Unauthorized` | Missing/expired JWT | Log in again |
| `403 Forbidden` | Wrong role for route | Use the correct account type |
| Prisma connection error | Bad `DATABASE_URL` | Verify Postgres is running and URL is correct |
| Empty parent dashboard | No parent–student link | Admin must link parent to student |
| Teacher sees no class | Not assigned to class | Admin assigns teachers on class edit |
| Seed says user exists | Already seeded | Safe to ignore; use existing admin |

---

## Project phases & roadmap

Current progress (see `context/build-plan.md`):

| Phase | Status | Highlights |
|-------|--------|------------|
| **1 — Foundation** | Done | Auth, roles, admin CRUD, admin portal UI |
| **2 — Attendance MVP** | Done | Teacher marking, parent history, absence notifications |
| **3 — Grades** | Mostly done | Teacher grade entry, parent grade view |
| **4 — Deadlines** | Planned | Exams/assignments with due dates |
| **5 — Stretch** | Planned | Materials, messaging, analytics, schedules |

Explicitly **out of scope** for now: SCORM/xAPI, payments, gamification, AI chatbots, enterprise BI integrations, compliance tooling.

---

## Development guidelines

- **Layered backend:** routes → controllers → services → Prisma. No business logic in routes.
- **Role checks in middleware**, not scattered in handlers.
- **Consistent API responses** — `{ success, data }` or `{ success, error }`.
- **Secrets in `.env` only** — never hardcoded or committed.
- **Stay in phase** — check `context/build-plan.md` before adding features.
- **Parent data isolation** — parents can only query their own children's records (enforced server-side).

Full standards: `context/code-standards.md`  
Architecture: `context/architecture.md`  
Product scope: `context/project-overview.md`

---

## Related documentation

| Document | Description |
|----------|-------------|
| [BRUNO_GUIDE.md](BRUNO_GUIDE.md) | Test the API with Bruno |
| [context/build-plan.md](context/build-plan.md) | Feature checklist and progress |
| [context/architecture.md](context/architecture.md) | Stack and system boundaries |
| [context/project-overview.md](context/project-overview.md) | Product vision and scope |
| [Database_Schema.md](Database_Schema.md) | Schema notes |
| [WORKFLOW.md](WORKFLOW.md) | Session-by-session dev workflow |
| [CLAUDE.md](CLAUDE.md) | Agent entry point for AI-assisted development |

---

## License

ISC
