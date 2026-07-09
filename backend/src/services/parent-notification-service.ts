import { prisma } from "../lib/prisma";
import { appErrors } from "../lib/app-error";

interface ListParentNotificationsPayload {
  parentUserId: string;
  schoolId: string;
}

interface MarkNotificationReadPayload {
  parentUserId: string;
  schoolId: string;
  notificationId: string;
}

function parseId(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw appErrors.badRequest(`Invalid ${fieldName}`);
  }

  return parsed;
}

function formatNotification(notification: {
  id: number;
  type: "absence";
  readAt: Date | null;
  createdAt: Date;
  student: {
    id: number;
    name: string;
    class: {
      id: number;
      name: string;
    };
  };
  attendance: {
    id: number;
    date: Date;
    status: "present" | "absent" | "late";
    class: {
      id: number;
      name: string;
    };
  };
}) {
  return {
    id: notification.id,
    type: notification.type,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    message: `${notification.student.name} was marked absent on ${notification.attendance.date.toISOString().slice(0, 10)}`,
    student: notification.student,
    attendance: notification.attendance,
  };
}

export async function listParentNotifications(payload: ListParentNotificationsPayload) {
  const parentUserId = parseId(payload.parentUserId, "parentUserId");
  const schoolId = parseId(payload.schoolId, "schoolId");

  const notifications = await prisma.notification.findMany({
    where: {
      parentUserId,
      parent: {
        schoolId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      type: true,
      readAt: true,
      createdAt: true,
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
    },
  });

  return notifications.map(formatNotification);
}

export async function markParentNotificationRead(payload: MarkNotificationReadPayload) {
  const parentUserId = parseId(payload.parentUserId, "parentUserId");
  const schoolId = parseId(payload.schoolId, "schoolId");
  const notificationId = parseId(payload.notificationId, "notificationId");

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      parentUserId,
      parent: {
        schoolId,
      },
    },
    select: {
      id: true,
      readAt: true,
    },
  });

  if (!notification) {
    throw appErrors.notFound("Notification not found");
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      readAt: new Date(),
    },
    select: {
      id: true,
      readAt: true,
    },
  });
}
