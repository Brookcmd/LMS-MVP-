import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing message-service
vi.mock("../lib/prisma", () => ({
  prisma: {
    student: {
      findFirst: vi.fn(),
    },
    classTeacher: {
      findFirst: vi.fn(),
    },
    parentStudent: {
      findFirst: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

import { prisma } from "../lib/prisma";
import {
  getOrCreateConversation,
  sendMessage,
  getConversationDetails,
} from "../services/message-service";

describe("message-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC-1 & AC-2: Conversation creation authorization", () => {
    it("should allow teacher to create conversation if assigned via ClassTeacher", async () => {
      vi.mocked(prisma.student.findFirst).mockResolvedValue({ id: 10, classId: 5 } as any);
      vi.mocked(prisma.classTeacher.findFirst).mockResolvedValue({ classId: 5, teacherId: 1 } as any);
      vi.mocked(prisma.parentStudent.findFirst).mockResolvedValue({ studentId: 10, parentUserId: 2 } as any);
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.conversation.create).mockResolvedValue({
        id: 100,
        studentId: 10,
        teacherId: 1,
        parentId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const conv = await getOrCreateConversation(1, "teacher", 12, {
        studentId: 10,
        parentId: 2,
      });

      expect(conv.id).toBe(100);
      expect(prisma.classTeacher.findFirst).toHaveBeenCalledWith({
        where: { classId: 5, teacherId: 1 },
      });
    });

    it("should reject teacher if NOT assigned to student class via ClassTeacher", async () => {
      vi.mocked(prisma.student.findFirst).mockResolvedValue({ id: 10, classId: 5 } as any);
      vi.mocked(prisma.classTeacher.findFirst).mockResolvedValue(null);

      await expect(
        getOrCreateConversation(1, "teacher", 12, {
          studentId: 10,
          parentId: 2,
        })
      ).rejects.toThrow("Teacher is not assigned to this student's class");
    });

    it("should reject parent if NOT linked to student via ParentStudent", async () => {
      vi.mocked(prisma.student.findFirst).mockResolvedValue({ id: 10, classId: 5 } as any);
      vi.mocked(prisma.parentStudent.findFirst).mockResolvedValue(null);

      await expect(
        getOrCreateConversation(2, "parent", 12, {
          studentId: 10,
          teacherId: 1,
        })
      ).rejects.toThrow("Parent is not linked to this student");
    });
  });

  describe("AC-7: Message validation", () => {
    it("should reject messages exceeding 1000 characters limit", async () => {
      const longContent = "a".repeat(1001);

      await expect(
        sendMessage(100, 1, "teacher", 12, { content: longContent })
      ).rejects.toThrow("Message content exceeds 1000 characters limit");
    });

    it("should reject empty or whitespace-only messages", async () => {
      await expect(
        sendMessage(100, 1, "teacher", 12, { content: "   " })
      ).rejects.toThrow("Message content cannot be empty");
    });
  });

  describe("AC-5 & AC-6: Sending messages and marking read", () => {
    it("should create message and recipient notification on send", async () => {
      vi.mocked(prisma.conversation.findFirst).mockResolvedValue({
        id: 100,
        studentId: 10,
        teacherId: 1,
        parentId: 2,
      } as any);
      vi.mocked(prisma.message.create).mockResolvedValue({
        id: 50,
        conversationId: 100,
        senderUserId: 1,
        content: "Hello parent",
        isRead: false,
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.conversation.update).mockResolvedValue({} as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      const msg = await sendMessage(100, 1, "teacher", 12, { content: "Hello parent" });

      expect(msg.id).toBe(50);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          recipientUserId: 2,
          studentId: 10,
          messageId: 50,
          type: "message",
        },
      });
    });

    it("should mark unread messages as read when viewing conversation details", async () => {
      vi.mocked(prisma.conversation.findFirst).mockResolvedValue({
        id: 100,
        studentId: 10,
        teacherId: 1,
        parentId: 2,
      } as any);
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);
      vi.mocked(prisma.message.count).mockResolvedValue(0);

      await getConversationDetails(100, 2, "parent", 12);

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: 100,
          senderUserId: { not: 2 },
          isRead: false,
        },
        data: { isRead: true },
      });
    });
  });
});
