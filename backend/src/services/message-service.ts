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

    // AC-1: Verify teacher is assigned to student's class via ClassTeacher, TeachingAssignment, or Homeroom
    const [classTeacher, teachingAssignment, cls] = await Promise.all([
      prisma.classTeacher?.findFirst
        ? prisma.classTeacher.findFirst({ where: { classId: student.classId, teacherId } })
        : null,
      prisma.teachingAssignment?.findFirst
        ? prisma.teachingAssignment.findFirst({ where: { classId: student.classId, teacherId } })
        : null,
      prisma.class?.findUnique
        ? prisma.class.findUnique({ where: { id: student.classId }, select: { homeroomTeacherId: true } })
        : null,
    ]);
    if (!classTeacher && !teachingAssignment && cls?.homeroomTeacherId !== teacherId) {
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

    // Verify teacher is assigned to student's class via ClassTeacher, TeachingAssignment, or Homeroom
    const [classTeacher, teachingAssignment, cls] = await Promise.all([
      prisma.classTeacher?.findFirst
        ? prisma.classTeacher.findFirst({ where: { classId: student.classId, teacherId } })
        : null,
      prisma.teachingAssignment?.findFirst
        ? prisma.teachingAssignment.findFirst({ where: { classId: student.classId, teacherId } })
        : null,
      prisma.class?.findUnique
        ? prisma.class.findUnique({ where: { id: student.classId }, select: { homeroomTeacherId: true } })
        : null,
    ]);
    if (!classTeacher && !teachingAssignment && cls?.homeroomTeacherId !== teacherId) {
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

export async function getEligibleRecipients(userId: number, role: string, schoolId: number) {
  if (role !== "parent" && role !== "teacher") {
    throw appErrors.forbidden("Only teachers and parents can access recipients");
  }

  if (role === "parent") {
    const parentLinks = await prisma.parentStudent.findMany({
      where: {
        parentUserId: userId,
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            classId: true,
            class: {
              select: {
                id: true,
                name: true,
                homeroomTeacherId: true,
                homeroomTeacher: {
                  select: { id: true, name: true, email: true },
                },
                teachers: {
                  select: {
                    teacher: {
                      select: { id: true, name: true, email: true },
                    },
                  },
                },
                teachingAssignments: {
                  select: {
                    teacher: {
                      select: { id: true, name: true, email: true },
                    },
                    subject: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (parentLinks.length === 0) return [];

    const studentIds = parentLinks.map((l) => l.student.id);
    const existingConversations = await prisma.conversation.findMany({
      where: {
        parentId: userId,
        studentId: { in: studentIds },
      },
      select: { id: true, studentId: true, teacherId: true },
    });

    const conversationMap = new Map<string, number>();
    for (const c of existingConversations) {
      conversationMap.set(`${c.studentId}_${c.teacherId}`, c.id);
    }

    const recipients: Array<{
      teacherId: number;
      teacherName: string;
      teacherEmail: string;
      studentId: number;
      studentName: string;
      classId: number;
      className: string;
      isHomeroom: boolean;
      roleLabel: string;
      existingConversationId: number | null;
    }> = [];

    for (const link of parentLinks) {
      const student = link.student;
      const cls = student.class;
      if (!cls) continue;

      const teacherMap = new Map<number, {
        id: number;
        name: string;
        email: string;
        isHomeroom: boolean;
        subjects: string[];
      }>();

      // Homeroom Teacher
      if (cls.homeroomTeacher) {
        teacherMap.set(cls.homeroomTeacher.id, {
          id: cls.homeroomTeacher.id,
          name: cls.homeroomTeacher.name,
          email: cls.homeroomTeacher.email,
          isHomeroom: true,
          subjects: [],
        });
      }

      // Class Teachers
      for (const ct of cls.teachers || []) {
        if (!ct.teacher) continue;
        if (!teacherMap.has(ct.teacher.id)) {
          teacherMap.set(ct.teacher.id, {
            id: ct.teacher.id,
            name: ct.teacher.name,
            email: ct.teacher.email,
            isHomeroom: cls.homeroomTeacherId === ct.teacher.id,
            subjects: [],
          });
        }
      }

      // Teaching Assignments
      for (const ta of cls.teachingAssignments || []) {
        if (!ta.teacher) continue;
        const subjectName = ta.subject?.name;
        const existing = teacherMap.get(ta.teacher.id);
        if (existing) {
          if (subjectName && !existing.subjects.includes(subjectName)) {
            existing.subjects.push(subjectName);
          }
        } else {
          teacherMap.set(ta.teacher.id, {
            id: ta.teacher.id,
            name: ta.teacher.name,
            email: ta.teacher.email,
            isHomeroom: cls.homeroomTeacherId === ta.teacher.id,
            subjects: subjectName ? [subjectName] : [],
          });
        }
      }

      for (const t of teacherMap.values()) {
        const labels: string[] = [];
        if (t.isHomeroom) labels.push("Homeroom Teacher");
        if (t.subjects.length > 0) {
          labels.push(t.subjects.join(", "));
        } else if (!t.isHomeroom) {
          labels.push("Teacher");
        }

        const existingConvId = conversationMap.get(`${student.id}_${t.id}`) ?? null;

        recipients.push({
          teacherId: t.id,
          teacherName: t.name,
          teacherEmail: t.email,
          studentId: student.id,
          studentName: student.name,
          classId: cls.id,
          className: cls.name,
          isHomeroom: t.isHomeroom,
          roleLabel: labels.join(" • ") || "Teacher",
          existingConversationId: existingConvId,
        });
      }
    }

    return recipients;
  }

  // Teacher role
  const [classTeachers, teachingAssignments, homeroomClasses] = await Promise.all([
    prisma.classTeacher.findMany({
      where: { teacherId: userId },
      select: { classId: true },
    }),
    prisma.teachingAssignment.findMany({
      where: { teacherId: userId },
      select: { classId: true },
    }),
    prisma.class.findMany({
      where: { homeroomTeacherId: userId, schoolId },
      select: { id: true },
    }),
  ]);

  const classIds = Array.from(
    new Set([
      ...classTeachers.map((c) => c.classId),
      ...teachingAssignments.map((t) => t.classId),
      ...homeroomClasses.map((h) => h.id),
    ])
  );

  if (classIds.length === 0) return [];

  const [students, existingConversations] = await Promise.all([
    prisma.student.findMany({
      where: {
        classId: { in: classIds },
        schoolId,
      },
      orderBy: { name: "asc" },
      include: {
        class: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    }),
    prisma.conversation.findMany({
      where: { teacherId: userId },
      select: { id: true, studentId: true, parentId: true },
    }),
  ]);

  const conversationMap = new Map<string, number>();
  for (const c of existingConversations) {
    conversationMap.set(`${c.studentId}_${c.parentId}`, c.id);
  }

  return students.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    classId: s.class.id,
    className: s.class.name,
    parents: (s.parents || []).map((p) => ({
      parentId: p.parent.id,
      parentName: p.parent.name,
      parentEmail: p.parent.email,
      parentPhone: p.parent.phone,
      relationship: p.relationship,
      isPrimary: p.isPrimary,
      existingConversationId: conversationMap.get(`${s.id}_${p.parent.id}`) ?? null,
    })),
  }));
}
