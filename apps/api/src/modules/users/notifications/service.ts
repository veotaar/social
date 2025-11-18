import db from "@api/db/db";
import { table } from "@api/db/model";
import { user } from "@api/db/schema";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

export const INITIAL_CURSOR = "initial";

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

  return {
    notifications,
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
  if (type === "post_like" && postId) {
    return await db
      .update(table.notification)
      .set({ deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')` })
      .where(
        and(
          eq(table.notification.senderId, senderId),
          eq(table.notification.recipientId, recipientId),
          eq(table.notification.postId, postId),
          eq(table.notification.type, type),
        ),
      );
  }

  if (type === "comment_like" && commentId) {
    return await db
      .update(table.notification)
      .set({ deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')` })
      .where(
        and(
          eq(table.notification.senderId, senderId),
          eq(table.notification.recipientId, recipientId),
          eq(table.notification.commentId, commentId),
          eq(table.notification.type, type),
        ),
      );
  }

  if (type === "comment" && postId) {
    return await db
      .update(table.notification)
      .set({ deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')` })
      .where(
        and(
          eq(table.notification.senderId, senderId),
          eq(table.notification.recipientId, recipientId),
          eq(table.notification.postId, postId),
          eq(table.notification.type, type),
        ),
      );
  }

  if (type === "follow_request" && followRequestId) {
    return await db
      .update(table.notification)
      .set({ deletedAt: sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')` })
      .where(
        and(
          eq(table.notification.senderId, senderId),
          eq(table.notification.recipientId, recipientId),
          eq(table.notification.followRequestId, followRequestId),
          eq(table.notification.type, type),
        ),
      );
  }

  if (type === "follow_accepted" && followRequestId) {
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
  // check if notification exists and belongs to current user
  const [existingNotification] = await db
    .select({
      id: table.notification.id,
      recipientId: table.notification.recipientId,
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

  return updatedNotification;
};

export const markNotificationAsUnread = async ({
  notificationId,
  currentUserId,
}: {
  notificationId: string;
  currentUserId: string;
}) => {
  // check if notification exists and belongs to current user
  const [existingNotification] = await db
    .select({
      id: table.notification.id,
      recipientId: table.notification.recipientId,
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

  return updatedNotification;
};

export const markNotificationsAsRead = async ({
  notificationIds,
  currentUserId,
}: {
  notificationIds: string[];
  currentUserId: string;
}) => {
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

  return updatedNotifications;
};

export const deleteNotification = async ({
  notificationId,
  currentUserId,
}: {
  notificationId: string;
  currentUserId: string;
}) => {
  // check if notification exists and belongs to current user
  const [existingNotification] = await db
    .select({
      id: table.notification.id,
      recipientId: table.notification.recipientId,
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

  return deletedNotification;
};
