# Verify: Teacher Parent Direct Messaging · spec 0002 · updated 2026-08-05
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Visit `/messages` as a Parent → verify conversation list loads and "+ New Message" button is active → AC-2, AC-4
- [ ] Start new conversation with assigned child's teacher → verify thread opens with recipient details → AC-2, AC-3
- [ ] Send message under 1000 characters → verify message bubble appears on right with timestamp → AC-4, AC-7
- [ ] Switch to Teacher account → visit `/messages` → verify incoming message thread displays unread badge → AC-4, AC-5
- [ ] Open thread as Teacher → verify messages mark as read and unread badge clears → AC-6
- [ ] Check Notifications page as Teacher → verify message notification appears under generic `/notifications` endpoint → AC-5

## Commands
- [ ] `npx vitest run src/__tests__/messages.test.ts` → 7 tests pass clean → AC-1, AC-2, AC-3, AC-5, AC-6, AC-7
- [ ] `npx tsc --noEmit` → TypeScript compilation passes with zero errors → All ACs

## Acceptance-criteria coverage
- AC-1: Covered by `messages.test.ts` (ClassTeacher lookup verification)
- AC-2: Covered by `messages.test.ts` (ParentStudent lookup verification)
- AC-3: Covered by `schema.prisma` models & `messages.test.ts` (Int primary & foreign keys, onDelete Restrict)
- AC-4: Covered by `Messages.jsx` auto refresh polling timer (10s thread / 15s list)
- AC-5: Covered by `message-service.ts` notification creation & `notifications.ts` router
- AC-6: Covered by `getConversationDetails` mark read update & `Messages.jsx`
- AC-7: Covered by `sendMessage` character limit validation & `messages.test.ts`
