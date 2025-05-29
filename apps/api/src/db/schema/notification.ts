import {
  pgTable,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import comment from "./comment";
import share from "./share";
import followRequest from "./followRequest";

export const notificationType = pgEnum("notification_type", [
  "like",
  "comment",
  "follow",
  "follow_request",
  "mention",
  "share",
]);

const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    type: notificationType("type").notNull(),
    postId: uuid("post_id").references(() => post.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => comment.id, {
      onDelete: "cascade",
    }),
    followRequestId: uuid("follow_request_id").references(
      () => followRequest.id,
      { onDelete: "cascade" },
    ),
    shareId: uuid("share_id").references(() => share.id, {
      onDelete: "cascade",
    }),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("notifications_recipient_id_idx").on(table.recipientId),
    index("notifications_sender_id_idx").on(table.senderId),
    index("notifications_type_idx").on(table.type),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
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
  share: one(share, {
    fields: [notification.shareId],
    references: [share.id],
  }),
}));

export default notification;
