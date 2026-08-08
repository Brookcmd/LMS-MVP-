# 0002. Teacher Parent Direct Messaging

**Date**: 2026-08-05
**Status**: Accepted

## Summary

This feature adds private direct messaging between teachers and parents. Messages are anchored to a specific student so teachers know which child is being discussed, while keeping student accounts isolated from parent teacher conversations. Near realtime updates use periodic HTTP polling (every 10 to 15 seconds) matching the project schedule pattern, paired with automatic in app unread notifications and badge counters.

## Context

Parents and teachers currently have no direct communication channel inside the school management platform. When a student is absent, receives a grade, or has an upcoming deadline, parents can view the status but cannot ask questions or coordinate with the teacher.

Without an in app messaging system, communication relies on external emails or phone calls, which leaves no record in the school platform and creates delays. Adding direct messaging linked to student profiles gives parents and teachers a secure record of communications while keeping student accounts separate and unaware of parent teacher discussions.

The existing Notification model is tightly coupled to parent absence alerts: its `parentUserId` column, `notification_parent` relation name, and `GET /parent/notifications` endpoint all assume the recipient is a parent. Messaging notifications must reach teachers too, so the model needs a recipient column that works for either role.

## Requirements

**User stories**:
- As a parent, I want to message my child's teacher about their progress so that I can get timely updates.
- As a teacher, I want to send private messages to parents of students in my classes so that I can communicate directly about performance or attendance.
- As a user (teacher or parent), I want unread indicators and periodic message updates so that I know when new messages arrive.

**Acceptance criteria**:
- **AC-1**: Teachers can start a new conversation thread only with parents of students enrolled in classes assigned to them via `ClassTeacher` (the `class_teachers` join table, queried as `prisma.classTeacher.findFirst({ where: { classId, teacherId } })`). This is the same ownership check the attendance service uses in `validateTeacherOwnsClass`.
- **AC-2**: Parents can start a new conversation thread only with teachers who teach one of their linked children via `ParentStudent`.
- **AC-3**: Every conversation is anchored to a specific student and records the teacher, parent, and student identity with Int primary keys.
- **AC-4**: Active conversation threads automatically refresh message history using periodic HTTP polling every 10 to 15 seconds.
- **AC-5**: New unread messages create an in app notification record in the Notification table (type `message`) for the recipient, regardless of whether the recipient is a parent or a teacher. The Notification model adds a `recipientUserId` column (Int, FK to User) so notifications can target any user role. Teachers can retrieve their own message notifications via a new `GET /notifications` endpoint.
- **AC-6**: Opening a conversation thread marks all unread messages in that thread as read for the viewing user.
- **AC-7**: Messages are restricted to plain text content up to 1000 characters per message.

## Options considered

### Option 1: Periodic HTTP polling every 10 to 15 seconds

Client fetches conversation messages periodically using HTTP GET requests every 10 to 15 seconds while the thread is active, matching the existing daily schedule polling approach.

**Pros**:
- Uses existing Express REST API infrastructure with zero added infrastructure complexity.
- Consistent with established project patterns for single school pilot requirements.

**Cons**:
- Small delay of up to 15 seconds before new messages appear if not actively sent by the user.

### Option 2: WebSockets with custom connection server

A full duplex WebSocket connection server for real time instant push delivery.

**Pros**:
- Sub second latency for incoming messages.

**Cons**:
- Requires connection lifecycle management, reconnect logic, and extra server complexity for a single school pilot.

## Decision

**Chosen option**: Option 1: Periodic HTTP polling every 10 to 15 seconds

We choose periodic HTTP polling over standard REST routes. This reuses our existing backend API pattern and avoids WebSocket connection complexity.

## Rationale

Periodic polling fits the single school pilot deployment needs while reusing the existing Express REST architecture. The schedule feature established that 10 to 30 second polling provides a reliable user experience without added connection state or socket servers. Persisted messages in Postgres provide durable audit history accessible to both parents and teachers.

Teacher eligibility for messaging uses `ClassTeacher` exclusively — the same ownership check the attendance service uses in `validateTeacherOwnsClass` (see `backend/src/services/attendance-service.ts` lines 102 to 119). If a teacher is assigned to the student's class via `ClassTeacher`, they can message the parent.

The existing `Notification.parentUserId` column and `notification_parent` relation cannot be reused for teacher recipients without schema changes. Rather than renaming `parentUserId` (which would break the existing attendance notification queries and the `GET /parent/notifications` endpoint), the spec adds a new `recipientUserId` column alongside the existing `parentUserId`. Existing absence notifications continue to use `parentUserId` unchanged. New message notifications use `recipientUserId` to target either a parent or teacher. A new generic `GET /notifications` endpoint serves both roles.

## Feature design

**Data model sketch**:

```prisma
// MODIFY enum NotificationType — add 'message' value
enum NotificationType {
  absence
  message
}

// MODIFY model Notification — add recipientUserId and messageId columns
// Existing parentUserId, attendanceId, and notification_parent relation stay unchanged
// for backward compatibility with absence notifications.
model Notification {
  id              Int              @id @default(autoincrement())
  parentUserId    Int?             @map("parent_user_id")     // kept for existing absence notifications
  recipientUserId Int?             @map("recipient_user_id")  // NEW: targets any user (parent or teacher) for message notifications
  studentId       Int              @map("student_id")
  attendanceId    Int?             @map("attendance_id")      // was required, now optional (message notifications have no attendance)
  messageId       Int?             @map("message_id")         // NEW: FK to Message for type 'message'
  type            NotificationType @default(absence)
  readAt          DateTime?        @map("read_at")
  createdAt       DateTime         @default(now()) @map("created_at")

  parent     User?       @relation("notification_parent", fields: [parentUserId], references: [id], onDelete: Cascade)
  recipient  User?       @relation("notification_recipient", fields: [recipientUserId], references: [id], onDelete: Cascade)
  student    Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  attendance Attendance? @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
  message    Message?    @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([parentUserId, readAt, createdAt])
  @@index([recipientUserId, readAt, createdAt])
  @@map("notifications")
}

// ADD to model User — new relation for recipientUserId
// (add this line to the User model's relation list)
// notificationsReceived Notification[] @relation("notification_recipient")

// NEW model Conversation
model Conversation {
  id        Int      @id @default(autoincrement())
  studentId Int      @map("student_id")
  teacherId Int      @map("teacher_id")
  parentId  Int      @map("parent_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  student  Student   @relation(fields: [studentId], references: [id], onDelete: Restrict)
  teacher  User      @relation("TeacherConversations", fields: [teacherId], references: [id], onDelete: Restrict)
  parent   User      @relation("ParentConversations", fields: [parentId], references: [id], onDelete: Restrict)
  messages Message[]

  @@unique([studentId, teacherId, parentId])
  @@map("conversations")
}

// NEW model Message
model Message {
  id             Int          @id @default(autoincrement())
  conversationId Int          @map("conversation_id")
  senderUserId   Int          @map("sender_user_id")
  content        String
  isRead         Boolean      @default(false) @map("is_read")
  createdAt      DateTime     @default(now()) @map("created_at")

  conversation  Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender        User           @relation(fields: [senderUserId], references: [id], onDelete: Cascade)
  notifications Notification[]

  @@map("messages")
}
```

**State transitions**:
- Message state: `isRead: false` (on creation) → `isRead: true` (when recipient opens conversation or calls mark read endpoint).

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /messages/conversations | GET | none | array of conversation objects with last message and unread count | bearer (teacher or parent) | 401 |
| /messages/conversations | POST | studentId:Int, teacherId:Int (if parent) or parentId:Int (if teacher) | conversation object | bearer | 400, 401, 403 |
| /messages/conversations/:id | GET | page:Int, limit:Int | conversation details with paginated messages array | bearer | 401, 403, 404 |
| /messages/conversations/:id/messages | POST | content:String (max 1000) | created message object | bearer | 400, 401, 403, 404 |
| /messages/conversations/:id/read | PATCH | none | success status object | bearer | 401, 403, 404 |
| /notifications | GET | none | array of notification objects (absence and message types) | bearer (any authenticated user) | 401 |
| /notifications/:id/read | PATCH | none | updated notification with readAt timestamp | bearer (any authenticated user) | 401, 403, 404 |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| List conversations | Conversation counterpart name and role | Derived from User profile table via teacherId or parentId on the Conversation |
| List conversations | Child student name | Derived from Student table via Conversation.studentId |
| List conversations | Unread count badge | Computed count of Message where conversationId matches and senderUserId != currentUserId and isRead is false |
| Send message | Message timestamp | Server clock at message insertion time |
| Send message | Notification record for recipient | Created in Notification table with type message, recipientUserId set to the other party, messageId set to the new message |
| List notifications (generic) | Notification type and message preview | Notification.type discriminates; for absence type, join attendance; for message type, join Message.content |
| Validate teacher eligibility | Whether teacher is assigned to the student's class | ClassTeacher row exists for (student.classId, teacher.userId) |

**Key invariants**:
- All primary keys and foreign keys use Int autoincrement types matching User, Student, and School.
- A parent can only create or view conversations for students linked to them in ParentStudent.
- A teacher can only create or view conversations for students in classes assigned to them via ClassTeacher (queried the same way as `validateTeacherOwnsClass` in the attendance service).
- Conversation deletion on student removal uses onDelete Restrict to preserve communication records.
- Student user accounts cannot access conversation endpoints.
- Message notifications set `recipientUserId` (not `parentUserId`) so they work for both teacher and parent recipients.
- Existing absence notifications continue to use `parentUserId` and are unaffected by this change.

**Security model**:
- Role middleware restricts conversation endpoints to `teacher` and `parent` roles.
- The new generic `GET /notifications` and `PATCH /notifications/:id/read` endpoints are accessible to any authenticated user (teacher or parent). They filter by `recipientUserId` (for message type) or `parentUserId` (for absence type) matching the JWT user ID.
- Server validates parent child relationship via ParentStudent and teacher class assignment via ClassTeacher before granting conversation access.

**Configuration required**:
- No new environment variables or credentials required.

**Critical test scenarios**:
- Happy path: Parent creates conversation with child's teacher, posts message, teacher polls API and sees message, verifying **AC-1**, **AC-2**, **AC-3**, **AC-4**.
- ClassTeacher validation: Teacher attempts to message parent of a student not in any class in `class_teachers` for that teacher, request rejected with 403 Forbidden, verifying **AC-1**.
- Restrict delete validation: Attempting to delete a Student record with existing Conversations fails with Prisma Restrict error, verifying **AC-3**.
- Teacher notification: Parent sends message to teacher, Notification record created with `recipientUserId` = teacher's user ID and type `message`, teacher retrieves it via `GET /notifications`, verifying **AC-5**.
- Parent notification: Teacher sends message to parent, Notification record created with `recipientUserId` = parent's user ID and type `message`, parent sees it alongside absence notifications, verifying **AC-5**.
- Mark read: User opens conversation, all messages where senderUserId != currentUserId get isRead set to true, verifying **AC-6**.
- Message validation: Sending message over 1000 characters returns 400 Bad Request, verifying **AC-7**.

## Build plan

1. Update `backend/prisma/schema.prisma`: add `message` to `NotificationType` enum, add `recipientUserId` (Int?, FK to User with `notification_recipient` relation) and `messageId` (Int?, FK to Message) to `Notification`, make `parentUserId` and `attendanceId` optional (Int?), add `notificationsReceived Notification[] @relation("notification_recipient")` to User model, add `Conversation` and `Message` models with Int primary keys and onDelete Restrict on student relation, then run `npx prisma db push`, satisfies **AC-3**, **AC-5**.
2. Implement message route service in `backend/src/routes/messages.ts` with teacher class assignment lookup via `prisma.classTeacher.findFirst({ where: { classId: student.classId, teacherId } })` (same pattern as `validateTeacherOwnsClass` in attendance service) and parent student validation via `prisma.parentStudent.findFirst`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-7**.
3. Implement generic notification endpoints: `GET /notifications` (returns notifications filtered by `recipientUserId` for message type and `parentUserId` for absence type, both matching JWT user ID) and `PATCH /notifications/:id/read`, in `backend/src/routes/notifications.ts`, satisfies **AC-5**.
4. Integrate notification creation in message service: on each new message, create a Notification record with `type: 'message'`, `recipientUserId` set to the other conversation participant, `messageId` set to the new message ID, and `studentId` from the conversation, satisfies **AC-5**.
5. Add API client methods in `frontend/react/src/api/apiClient.js` for messaging and generic notification endpoints, satisfies **AC-4**.
6. Build `TeacherMessages.jsx` and `ParentMessages.jsx` React pages with conversation list, chat thread view, 10 to 15 second auto refresh interval timer, and unread badge counters, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-6**.
7. Register `/messages` and `/notifications` routes in `backend/src/app.ts`, add navigation items in `App.jsx` and `BottomNav.jsx`, satisfies **AC-1**, **AC-2**.
8. Write unit tests in `backend/src/tests/messages.test.ts` verifying ClassTeacher based eligibility, ParentStudent validation, notification creation for both roles, and message content limits, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-7**.

## Consequences

**Positive**:
- Direct messaging integrated seamlessly into existing Express and Prisma REST infrastructure.
- Zero extra WebSocket complexity or new infrastructure services required.
- Notification model extended (not replaced) so existing absence notifications are unaffected.
- Teachers gain their own notification retrieval for the first time, previously notifications were parent only.
- Message histories are securely preserved with onDelete Restrict constraints.

**Negative / tradeoffs**:
- Polling introduces a 10 to 15 second update window for incoming messages when not actively typing.
- The Notification model now has two recipient columns (`parentUserId` for legacy absence use, `recipientUserId` for message use). A follow up migration could unify these, but that is out of scope for this feature to avoid breaking existing absence notification queries.
- Making `parentUserId` and `attendanceId` optional on Notification means existing code in `parent-notification-service.ts` should add null checks when querying absence notifications (minor, since absence notifications always have these set).

## Follow-up

- [ ] Consider a future migration to unify `parentUserId` and `recipientUserId` into a single `recipientUserId` on the Notification model, updating the attendance notification creation and `GET /parent/notifications` endpoint to use it.
