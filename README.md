# RollCall

RollCall is a school attendance tracking system built as Phase 1 of a larger school management platform idea. The project focuses on one practical problem: helping parents see whether their child attended school and giving teachers a fast way to record attendance.

## Overview

This MVP is designed for a single school and currently supports:

- Admin-managed school data such as classes, students, teachers, and parent-student links
- Teacher attendance marking for a class
- Parent access to attendance history for their child
- Basic absence notifications for parents

The goal is not to build a generic LMS immediately. Instead, the project is intentionally scoped to solve one real problem well for a real school before expanding further.

## Why this project exists

Attendance is often tracked manually, and parents often learn about absences late or not at all. RollCall aims to close that gap by making attendance visible in a simple, reliable workflow.

## Current scope

### In scope for this MVP

- Authentication and role-based access for admin, teacher, and parent users
- Admin CRUD operations for classes, students, teachers, and parent-student links
- Teacher attendance entry for a class
- Parent visibility into attendance history
- Basic absence notifications

### Out of scope for now

- Gradebooks and academic grading
- Assignments, exams, and deadlines
- Messaging between teachers and parents
- Advanced analytics or compliance tooling

## Tech stack

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT with bcrypt password hashing
- Frontend: Next.js + React + TypeScript (UI components were migrated from an earlier project and reconnected to this backend API)

## Project structure

```text
backend/
  prisma/                # Prisma schema, migrations, and seed script
  src/
    controllers/         # Request/response handlers
    services/            # Business logic
    routes/              # Express routes
    middleware/          # Auth, roles, and error handling
    lib/                 # Shared utilities and helpers
frontend/                # Frontend app
context/                 # Product, architecture, and planning docs
```

## Core features

### Authentication and authorization

- Admin-created accounts for teachers and parents
- Login endpoint that returns a JWT
- Protected routes using JWT-based middleware
- Role checks for admin, teacher, and parent access

### Admin features

- Create, list, update, and delete classes
- Create, list, update, and delete students
- List teachers and manage teacher accounts
- Link parents to their children

### Teacher features

- Mark attendance for an entire class in a batch
- Record attendance as present, absent, or late
- View attendance for a class and date

### Parent features

- View attendance history for a child
- Filter by date range
- See attendance records relevant only to their own children

## API overview

The backend currently exposes the following main endpoints:

### Health

- GET /health

### Authentication

- POST /auth/signup
- POST /auth/login

### Admin resources

- GET /classes
- POST /classes
- GET /classes/:classId
- PUT /classes/:classId
- DELETE /classes/:classId

- GET /students
- POST /students
- GET /students/:studentId
- PUT /students/:studentId
- DELETE /students/:studentId

- GET /teachers
- GET /teachers/:teacherId

- GET /parent-students
- POST /parent-students
- DELETE /parent-students/:parentUserId/:studentId

### Attendance

- POST /attendance/batch
- GET /attendance

### Parent access

- GET /parent/attendance

## Database model

The current Prisma schema includes:

- School
- User
- Student
- ParentStudent
- Class
- Attendance
- Notification

These models support the core attendance workflow and the basic parent notification flow.

## Prerequisites

Before running the project locally, make sure you have:

- Node.js installed
- PostgreSQL running
- A database created for the app

## Getting started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a backend environment file. A typical configuration looks like this:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/rollcall
JWT_SECRET=replace-with-a-secure-secret
PORT=3000
```

4. Generate the Prisma client and apply migrations:

```bash
npm run prisma:generate
npx prisma migrate dev
```

5. Seed the database with an initial admin user:

```bash
npm run prisma:seed
```

6. Start the development server:

```bash
npm run dev
```

The API will be available locally on port 3000 unless you override it with the PORT environment variable.

## Useful scripts

From the project root:

```bash
npm run dev         # start the backend in development mode
npm run build       # compile the TypeScript backend
npm run prisma:generate
npm run prisma:validate
npm run prisma:seed
```

## Development notes

The codebase follows a layered structure:

- Routes define HTTP endpoints only
- Controllers handle request and response shaping
- Services contain the business logic
- Middleware handles authentication, role checks, and error handling

This structure keeps the backend easier to reason about and makes role-based access control consistent.

## Current status

The core MVP backend is implemented and covers the main attendance workflow:

- Authentication and role-based access
- Admin resource management
- Teacher attendance marking
- Parent attendance history access
- Initial absence notification support

The project is still in an early-stage MVP phase, so scope should remain focused on attendance and school management basics rather than broad LMS features.

## Contributing

When contributing, keep changes aligned with the current phase and project scope. Prefer small, focused updates and follow the existing architecture patterns already used in the backend.

## License

This project is distributed under the ISC license.
