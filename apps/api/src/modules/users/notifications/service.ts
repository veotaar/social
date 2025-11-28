import db from "@api/db/db";
import { table } from "@api/db/model";
import { user } from "@api/db/schema";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import {
  getCachedNotificationCount,
  setCachedNotificationCount,
  incrementNotificationCount,
  decrementNotificationCount,
  invalidateNotificationCountCache,
} from "@api/lib/cache";
import { broadcastNewNotification } from "@api/lib/ws";

export const INITIAL_CURSOR = "initial";

export const getUnreadNotificationCount = async (
  userId: string,
): Promise<number> => {
  // try cache first
  const cached = await getCachedNotificationCount(userId);
  if (cached !== null) {
    return cached;
  }

  // fetch from DB otherwise
  const count = await db.$count(
    table.notification,
    and(
      eq(table.notification.recipientId, userId),
      eq(table.notification.isRead, false),
      isNull(table.notification.deletedAt),
    ),
  );

  await setCachedNotificationCount(userId, count);

  return count;
};

export const getNotifications = async ({
  currentUserId,
  limit = 10,
  cursor,
}: {
  currentUserId: string;
  limit?: number;
  cursor: string;
}) => {
  const applyCursor = cursor !== INITIAL_CURSOR;

  const unreadCount = await getUnreadNotificationCount(currentUserId);

  const notifications = await db
    .select({
      notification: {
        id: table.notification.id,
        recipientId: table.notification.recipientId,
        type: table.notification.type,
        postId: table.notification.postId,
        commentId: table.notification.commentId,
        followRequestId: table.notification.followRequestId,
        followId: table.notification.followId,
        shareId: table.notification.shareId,
        isRead: table.notification.isRead,
        createdAt: table.notification.createdAt,
      },
      sender: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        name: user.name,
        image: user.image,
      },
    })
    .from(table.notification)
    .where(
      and(
        eq(table.notification.recipientId, currentUserId),
        isNull(table.notification.deletedAt),
        applyCursor ? lt(table.notification.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(table.notification.id))
    .limit(limit + 1)
    .leftJoin(user, eq(table.notification.senderId, user.id));

  let hasMore = false;
  let nextCursor: string | null = null;

  if (notifications.length > limit) {
    hasMore = true;
    notifications.pop();
  }

  if (notifications.length > 0) {
    const lastNotification =
      notifications[notifications.length - 1]?.notification;
    if (lastNotification) {
      nextCursor = lastNotification.id;
    }
  }

  const notificationsWithCount = notifications.map((n) => ({
    ...n,
    unreadCount,
  }));

  return {
    notifications: notificationsWithCount,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

export const createNotification = async ({
  senderId,
  recipientId,
  postId,
  commentId,
  followRequestId,
  followId,
  type,
}: {
  senderId: string;
  recipientId: string;
  postId?: string;
  commentId?: string;
  followRequestId?: string;
  followId?: string;
  type:
    | "follow_request"
    | "comment_like"
    | "post_like"
    | "comment"
    | "follow"
    | "follow_accepted";
}) => {
  if (senderId === recipientId) {
    return null;
  }

  const [newNotification] = await db
    .insert(table.notification)
    .values({
      senderId,
      recipientId,
      postId,
      commentId,
      followRequestId,
      followId,
      type,
    })
    .returning();

  // increment cached unread count for recipient
  await incrementNotificationCount(recipientId);

  // broadcast real-time notification event to recipient if online
  broadcastNewNotification(recipientId, newNotification.id);

  return newNotification;
};

export const removeNotification = async ({
  senderId,
  recipientId,
  type,
  postId,
  commentId,
  followRequestId,
}: {
  senderId: string;
  recipientId: string;
  postId?: string;
  commentId?: string;
  followRequestId?: string;
  type:
    | "follow_request"
    | "comment_like"
    | "post_like"
    | "comment"
    | "follow"
    | "follow_accepted";
}) => {
  // helper to find unread notification and decrement count after removal
  const decrementIfUnread = async (conditions: ReturnType<typeof and>) => {
    // check if the notification being removed was unread
    const [existing] = await db
      .select({ isRead: table.notification.isRead })
      .from(table.notification)
      .where(and(conditions, isNull(table.notification.deletedAt)));

    const result = await db
      .update(table.notification)
      .set({ deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')` })
      .where(conditions);

    // decrement cached count if it was unread
    if (existing && !existing.isRead) {
      await decrementNotificationCount(recipientId);
    }

    return result;
  };

  if (type === "post_like" && postId) {
    return await decrementIfUnread(
      and(
        eq(table.notification.senderId, senderId),
        eq(table.notification.recipientId, recipientId),
        eq(table.notification.postId, postId),
        eq(table.notification.type, type),
      ),
    );
  }

  if (type === "comment_like" && commentId) {
    return await decrementIfUnread(
      and(
        eq(table.notification.senderId, senderId),
        eq(table.notification.recipientId, recipientId),
        eq(table.notification.commentId, commentId),
        eq(table.notification.type, type),
      ),
    );
  }

  if (type === "comment" && postId) {
    return await decrementIfUnread(
      and(
        eq(table.notification.senderId, senderId),
        eq(table.notification.recipientId, recipientId),
        eq(table.notification.postId, postId),
        eq(table.notification.type, type),
      ),
    );
  }

  if (type === "follow_request" && followRequestId) {
    return await decrementIfUnread(
      and(
        eq(table.notification.senderId, senderId),
        eq(table.notification.recipientId, recipientId),
        eq(table.notification.followRequestId, followRequestId),
        eq(table.notification.type, type),
      ),
    );
  }

  if (type === "follow_accepted" && followRequestId) {
    // for follow_accepted, we also mark as read, so no need to decrement
    return await db
      .update(table.notification)
      .set({
        deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`,
        isRead: true,
      })
      .where(
        and(
          eq(table.notification.senderId, senderId),
          eq(table.notification.recipientId, recipientId),
          eq(table.notification.followRequestId, followRequestId),
          eq(table.notification.type, type),
        ),
      );
  }

  return null;
};

export const markNotificationAsRead = async ({
  notificationId,
  currentUserId,
}: {
  notificationId: string;
  currentUserId: string;
}) => {
  // check if notification exists, belongs to current user, and is unread
  const [existingNotification] = await db
    .select({
      id: table.notification.id,
      recipientId: table.notification.recipientId,
      isRead: table.notification.isRead,
    })
    .from(table.notification)
    .where(
      and(
        eq(table.notification.id, notificationId),
        eq(table.notification.recipientId, currentUserId),
      ),
    );

  if (
    !existingNotification ||
    existingNotification.recipientId !== currentUserId
  ) {
    return null;
  }

  const [updatedNotification] = await db
    .update(table.notification)
    .set({ isRead: true })
    .where(
      and(
        eq(table.notification.id, notificationId),
        eq(table.notification.recipientId, currentUserId),
      ),
    )
    .returning();

  // decrement cached count only if it was previously unread
  if (!existingNotification.isRead) {
    await decrementNotificationCount(currentUserId);
  }

  return updatedNotification;
};

export const markNotificationAsUnread = async ({
  notificationId,
  currentUserId,
}: {
  notificationId: string;
  currentUserId: string;
}) => {
  // check if notification exists, belongs to current user, and is read
  const [existingNotification] = await db
    .select({
      id: table.notification.id,
      recipientId: table.notification.recipientId,
      isRead: table.notification.isRead,
    })
    .from(table.notification)
    .where(
      and(
        eq(table.notification.id, notificationId),
        eq(table.notification.recipientId, currentUserId),
      ),
    );

  if (
    !existingNotification ||
    existingNotification.recipientId !== currentUserId
  ) {
    return null;
  }

  const [updatedNotification] = await db
    .update(table.notification)
    .set({ isRead: false })
    .where(
      and(
        eq(table.notification.id, notificationId),
        eq(table.notification.recipientId, currentUserId),
      ),
    )
    .returning();

  // increment cached count only if it was previously read
  if (existingNotification.isRead) {
    await incrementNotificationCount(currentUserId);
  }

  return updatedNotification;
};

export const markNotificationsAsRead = async ({
  notificationIds,
  currentUserId,
}: {
  notificationIds: string[];
  currentUserId: string;
}) => {
  // count how many unread notifications we're about to mark as read
  const unreadCount = await db.$count(
    table.notification,
    and(
      eq(table.notification.recipientId, currentUserId),
      eq(table.notification.isRead, false),
      inArray(table.notification.id, notificationIds),
    ),
  );

  const updatedNotifications = await db
    .update(table.notification)
    .set({ isRead: true })
    .where(
      and(
        eq(table.notification.recipientId, currentUserId),
        inArray(table.notification.id, notificationIds),
      ),
    )
    .returning();

  // decrement cached count by the number of actually unread notifications
  if (unreadCount > 0) {
    await decrementNotificationCount(currentUserId, unreadCount);
  }

  return updatedNotifications;
};

export const deleteNotification = async ({
  notificationId,
  currentUserId,
}: {
  notificationId: string;
  currentUserId: string;
}) => {
  // check if notification exists, belongs to current user, and get read status
  const [existingNotification] = await db
    .select({
      id: table.notification.id,
      recipientId: table.notification.recipientId,
      isRead: table.notification.isRead,
    })
    .from(table.notification)
    .where(
      and(
        eq(table.notification.id, notificationId),
        eq(table.notification.recipientId, currentUserId),
      ),
    );

  if (
    !existingNotification ||
    existingNotification.recipientId !== currentUserId
  ) {
    return null;
  }

  const deletedNotification = await db
    .update(table.notification)
    .set({ deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')` })
    .where(
      and(
        eq(table.notification.id, notificationId),
        eq(table.notification.recipientId, currentUserId),
      ),
    )
    .returning();

  // decrement cached count only if the deleted notification was unread
  if (!existingNotification.isRead) {
    await decrementNotificationCount(currentUserId);
  }

  return deletedNotification;
};
