import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

function parseId(value: string | number, fieldName: string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }
  return parsed;
}

export async function listUserNotifications(userId: number, schoolId: number) {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { recipientUserId: userId },
        { parentUserId: userId },
      ],
      student: {
        schoolId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      attendance: {
        select: {
          id: true,
          date: true,
          status: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      message: {
        select: {
          id: true,
          content: true,
          conversationId: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return notifications.map((notif) => {
    if (notif.type === "message" && notif.message) {
      return {
        id: notif.id,
        type: notif.type,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        messageText: `New message from ${notif.message.sender.name}: "${notif.message.content.slice(0, 50)}${notif.message.content.length > 50 ? '...' : ''}"`,
        conversationId: notif.message.conversationId,
        messageId: notif.message.id,
        student: notif.student,
        sender: notif.message.sender,
      };
    }

    // Default absence notification
    const dateStr = notif.attendance?.date ? new Date(notif.attendance.date).toISOString().slice(0, 10) : "";
    return {
      id: notif.id,
      type: notif.type,
      readAt: notif.readAt,
      createdAt: notif.createdAt,
      messageText: `${notif.student.name} was marked absent on ${dateStr}`,
      student: notif.student,
      attendance: notif.attendance,
    };
  });
}

export async function markNotificationRead(notificationIdValue: string | number, userId: number) {
  const notificationId = parseId(notificationIdValue, "notificationId");

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [
        { recipientUserId: userId },
        { parentUserId: userId },
      ],
    },
  });

  if (!notification) {
    throw appErrors.notFound("Notification not found");
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}
