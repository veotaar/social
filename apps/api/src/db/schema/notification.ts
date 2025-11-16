import {
  pgTable,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  index,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import comment from "./comment";
import share from "./share";
import followRequest from "./followRequest";
import follow from "./follow";
import { uuidv7 } from "uuidv7";

export const notificationType = pgEnum("notification_type", [
  "like",
  "comment",
  "follow",
  "follow_request",
  "follow_accepted",
  "mention",
  "share",
]);

const notification = pgTable(
  "notification",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),
    type: notificationType("type").notNull(),
    postId: text("post_id").references(() => post.id, {
      onDelete: "cascade",
    }),
    commentId: text("comment_id").references(() => comment.id, {
      onDelete: "cascade",
    }),
    followRequestId: text("follow_request_id").references(
      () => followRequest.id,
      { onDelete: "cascade" },
    ),
    followId: text("follow_id").references(() => follow.id, {
      onDelete: "cascade",
    }),
    shareId: text("share_id").references(() => share.id, {
      onDelete: "cascade",
    }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("notifications_recipient_id_idx").on(table.recipientId),
    index("notifications_sender_id_idx").on(table.senderId),
    index("notifications_type_idx").on(table.type),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_is_deleted_idx").on(table.deletedAt),
  ],
);

export const notificationRelations = relations(notification, ({ one }) => ({
  recipient: one(user, {
    fields: [notification.recipientId],
    references: [user.id],
    relationName: "receivedNotifications",
  }),
  sender: one(user, {
    fields: [notification.senderId],
    references: [user.id],
    relationName: "sentNotifications",
  }),
  post: one(post, {
    fields: [notification.postId],
    references: [post.id],
  }),
  comment: one(comment, {
    fields: [notification.commentId],
    references: [comment.id],
  }),
  followRequest: one(followRequest, {
    fields: [notification.followRequestId],
    references: [followRequest.id],
  }),
  follow: one(follow, {
    fields: [notification.followId],
    references: [follow.id],
  }),
  share: one(share, {
    fields: [notification.shareId],
    references: [share.id],
  }),
}));

export default notification;
