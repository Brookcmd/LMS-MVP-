import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

function parseId(value: unknown, fieldName: string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }
  return parsed;
}

export interface CreateConversationPayload {
  studentId: number | string;
  teacherId?: number | string;
  parentId?: number | string;
}

export interface SendMessagePayload {
  content: string;
}

export async function listConversations(userId: number, role: string, schoolId: number) {
  const isTeacher = role === "teacher";
  const isParent = role === "parent";

  if (!isTeacher && !isParent) {
    throw appErrors.forbidden("Only teachers and parents can access conversations");
  }

  const whereClause = isTeacher
    ? { teacherId: userId, teacher: { schoolId } }
    : { parentId: userId, parent: { schoolId } };

  const conversations = await prisma.conversation.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      student: {
        select: { id: true, name: true, class: { select: { id: true, name: true } } },
      },
      teacher: {
        select: { id: true, name: true, email: true },
      },
      parent: {
        select: { id: true, name: true, email: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderUserId: true, isRead: true, createdAt: true },
      },
    },
  });

  // Calculate unread count for each conversation
  const conversationIds = conversations.map((c) => c.id);
  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversationIds },
      senderUserId: { not: userId },
      isRead: false,
    },
    _count: { id: true },
  });

  const unreadMap = new Map<number, number>();
  for (const group of unreadCounts) {
    unreadMap.set(group.conversationId, group._count.id);
  }

  return conversations.map((conv) => ({
    id: conv.id,
    studentId: conv.studentId,
    student: conv.student,
    teacher: conv.teacher,
    parent: conv.parent,
    lastMessage: conv.messages[0] || null,
    unreadCount: unreadMap.get(conv.id) || 0,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }));
}

export async function getOrCreateConversation(
  userId: number,
  userRole: string,
  schoolId: number,
  payload: CreateConversationPayload
) {
  const studentId = parseId(payload.studentId, "studentId");

  // Verify student exists and belongs to the same school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true, classId: true },
  });
  if (!student) {
    throw appErrors.notFound("Student not found");
  }

  let teacherId: number;
  let parentId: number;

  if (userRole === "teacher") {
    teacherId = userId;
    if (!payload.parentId) {
      throw appErrors.badRequest("parentId is required for teachers initiating a conversation");
    }
    parentId = parseId(payload.parentId, "parentId");

    // AC-1: Verify teacher is assigned to student's class via ClassTeacher
    const classTeacher = await prisma.classTeacher.findFirst({
      where: { classId: student.classId, teacherId },
    });
    if (!classTeacher) {
      throw appErrors.forbidden("Teacher is not assigned to this student's class");
    }

    // Verify parent is linked to student
    const parentLink = await prisma.parentStudent.findFirst({
      where: { studentId, parentUserId: parentId },
    });
    if (!parentLink) {
      throw appErrors.badRequest("Selected parent is not linked to this student");
    }
  } else if (userRole === "parent") {
    parentId = userId;
    if (!payload.teacherId) {
      throw appErrors.badRequest("teacherId is required for parents initiating a conversation");
    }
    teacherId = parseId(payload.teacherId, "teacherId");

    // AC-2: Verify parent is linked to student via ParentStudent
    const parentLink = await prisma.parentStudent.findFirst({
      where: { studentId, parentUserId: parentId },
    });
    if (!parentLink) {
      throw appErrors.forbidden("Parent is not linked to this student");
    }

    // Verify teacher is assigned to student's class via ClassTeacher
    const classTeacher = await prisma.classTeacher.findFirst({
      where: { classId: student.classId, teacherId },
    });
    if (!classTeacher) {
      throw appErrors.badRequest("Selected teacher is not assigned to this student's class");
    }
  } else {
    throw appErrors.forbidden("Only teachers and parents can create conversations");
  }

  // Find existing or create new
  let conversation = await prisma.conversation.findUnique({
    where: {
      studentId_teacherId_parentId: {
        studentId,
        teacherId,
        parentId,
      },
    },
    include: {
      student: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
      teacher: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, name: true, email: true } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        studentId,
        teacherId,
        parentId,
      },
      include: {
        student: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  return conversation;
}

export async function getConversationDetails(
  conversationIdValue: string | number,
  userId: number,
  userRole: string,
  schoolId: number,
  page = 1,
  limit = 50
) {
  const conversationId = parseId(conversationIdValue, "conversationId");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
    include: {
      student: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
      teacher: { select: { id: true, name: true, email: true, schoolId: true } },
      parent: { select: { id: true, name: true, email: true, schoolId: true } },
    },
  });

  if (!conversation) {
    throw appErrors.notFound("Conversation not found");
  }

  // Verify membership & school
  if (userRole === "teacher" && conversation.teacherId !== userId) {
    throw appErrors.forbidden("You are not a participant in this conversation");
  }
  if (userRole === "parent" && conversation.parentId !== userId) {
    throw appErrors.forbidden("You are not a participant in this conversation");
  }
  if (userRole !== "teacher" && userRole !== "parent") {
    throw appErrors.forbidden("Only teachers and parents can access conversations");
  }

  // Mark unread messages in thread as read for viewing user (AC-6)
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderUserId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  // Also mark corresponding message notifications as read
  await prisma.notification.updateMany({
    where: {
      recipientUserId: userId,
      message: { conversationId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const skip = (page - 1) * limit;
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  const totalMessages = await prisma.message.count({ where: { conversationId } });

  return {
    conversation: {
      id: conversation.id,
      studentId: conversation.studentId,
      student: conversation.student,
      teacher: conversation.teacher,
      parent: conversation.parent,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
    messages,
    pagination: {
      page,
      limit,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
    },
  };
}

export async function sendMessage(
  conversationIdValue: string | number,
  senderUserId: number,
  userRole: string,
  schoolId: number,
  payload: SendMessagePayload
) {
  const conversationId = parseId(conversationIdValue, "conversationId");

  if (!payload.content || typeof payload.content !== "string" || !payload.content.trim()) {
    throw appErrors.badRequest("Message content cannot be empty");
  }

  const content = payload.content.trim();
  if (content.length > 1000) {
    throw appErrors.badRequest("Message content exceeds 1000 characters limit");
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw appErrors.notFound("Conversation not found");
  }

  // Verify sender is participant
  if (userRole === "teacher" && conversation.teacherId !== senderUserId) {
    throw appErrors.forbidden("You are not a participant in this conversation");
  }
  if (userRole === "parent" && conversation.parentId !== senderUserId) {
    throw appErrors.forbidden("You are not a participant in this conversation");
  }

  const recipientUserId = senderUserId === conversation.teacherId ? conversation.parentId : conversation.teacherId;

  // Create message and notification in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId,
        senderUserId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Update conversation updatedAt timestamp
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create Notification record for recipient (AC-5)
    await tx.notification.create({
      data: {
        recipientUserId,
        studentId: conversation.studentId,
        messageId: message.id,
        type: "message",
      },
    });

    return message;
  });

  return result;
}

export async function markConversationRead(
  conversationIdValue: string | number,
  userId: number,
  userRole: string
) {
  const conversationId = parseId(conversationIdValue, "conversationId");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw appErrors.notFound("Conversation not found");
  }

  if (userRole === "teacher" && conversation.teacherId !== userId) {
    throw appErrors.forbidden("You are not a participant in this conversation");
  }
  if (userRole === "parent" && conversation.parentId !== userId) {
    throw appErrors.forbidden("You are not a participant in this conversation");
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderUserId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  await prisma.notification.updateMany({
    where: {
      recipientUserId: userId,
      message: { conversationId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { success: true };
}
