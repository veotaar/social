import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  varchar,
  decimal,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { user } from "./auth-schema";

export const subscriptionPlanTypeEnum = pgEnum("subscription_plan_type", [
  "free",
  "premium",
  "pro",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
  "pending",
]);

export const followRequestStatusEnum = pgEnum("follow_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "like",
  "comment",
  "follow",
  "follow_request",
  "mention",
  "share",
]);

export const postTypeEnum = pgEnum("post_type", ["original", "share"]);

export const subscriptionPlan = pgTable("subscription_plan", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  name: varchar("name", { length: 50 }).notNull(),
  type: subscriptionPlanTypeEnum("type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in days
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSubscription = pgTable(
  "user_subscription",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlan.id),
    status: subscriptionStatusEnum("status").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    autoRenew: boolean("auto_renew").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("user_subscriptions_user_id_idx").on(table.userId),
    index("user_subscriptions_status_idx").on(table.status),
  ],
);

export const followRequest = pgTable(
  "follow_request",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: followRequestStatusEnum("status").default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("follow_requests_follower_following_idx").on(
      table.followerId,
      table.followingId,
    ),
    index("follow_requests_follower_id_idx").on(table.followerId),
    index("follow_requests_following_id_idx").on(table.followingId),
    index("follow_requests_status_idx").on(table.status),
  ],
);

export const follow = pgTable(
  "follow",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("follows_follower_following_idx").on(
      table.followerId,
      table.followingId,
    ),
    index("follows_follower_id_idx").on(table.followerId),
    index("follows_following_id_idx").on(table.followingId),
  ],
);

export const block = pgTable(
  "block",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("blocks_blocker_blocked_idx").on(
      table.blockerId,
      table.blockedId,
    ),
    index("blocks_blocker_id_idx").on(table.blockerId),
    index("blocks_blocked_id_idx").on(table.blockedId),
  ],
);

export const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content"),
    sharedPostId: uuid("shared_post_id"),
    shareComment: text("share_comment"),
    likesCount: integer("likes_count").default(0),
    commentsCount: integer("comments_count").default(0),
    sharesCount: integer("shares_count").default(0),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("posts_author_id_idx").on(table.authorId),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_is_deleted_idx").on(table.isDeleted),
    foreignKey({
      columns: [table.sharedPostId],
      foreignColumns: [table.id],
      name: "fk_share_id",
    }),
  ],
);

export const postImage = pgTable(
  "post_image",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    altText: varchar("alt_text", { length: 255 }),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("post_images_post_id_idx").on(table.postId),
    uniqueIndex("post_images_post_id_order_idx").on(table.postId, table.order),
  ],
);

export const comment = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    parentCommentId: uuid("parent_comment_id"),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    likesCount: integer("likes_count").default(0),
    repliesCount: integer("replies_count").default(0),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("comments_author_id_idx").on(table.authorId),
    index("comments_post_id_idx").on(table.postId),
    index("comments_parent_comment_id_idx").on(table.parentCommentId),
    index("comments_created_at_idx").on(table.createdAt),
    index("comments_is_deleted_idx").on(table.isDeleted),
    foreignKey({
      columns: [table.parentCommentId],
      foreignColumns: [table.id],
      name: "fk_parent_id",
    }),
  ],
);

export const like = pgTable(
  "like",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => post.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => comment.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("likes_user_post_idx").on(table.userId, table.postId),
    uniqueIndex("likes_user_comment_idx").on(table.userId, table.commentId),
    index("likes_user_id_idx").on(table.userId),
    index("likes_post_id_idx").on(table.postId),
    index("likes_comment_id_idx").on(table.commentId),
  ],
);

export const share = pgTable(
  "share",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    originalPostId: uuid("original_post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("shares_user_original_post_idx").on(
      table.userId,
      table.originalPostId,
    ),
    index("shares_user_id_idx").on(table.userId),
    index("shares_original_post_id_idx").on(table.originalPostId),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    type: notificationTypeEnum("type").notNull(),
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

// Relations
export const usersRelations = relations(user, ({ many, one }) => ({
  posts: many(post),
  comments: many(comment),
  likes: many(like),
  shares: many(share),
  sentFollowRequests: many(followRequest, {
    relationName: "sentFollowRequests",
  }),
  receivedFollowRequests: many(followRequest, {
    relationName: "receivedFollowRequests",
  }),
  followers: many(follow, { relationName: "followers" }),
  following: many(follow, { relationName: "following" }),
  // Block relations
  blockedUsers: many(block, { relationName: "blockedUsers" }),
  blockedByUsers: many(block, { relationName: "blockedByUsers" }),
  sentNotifications: many(notification, {
    relationName: "sentNotifications",
  }),
  receivedNotifications: many(notification, {
    relationName: "receivedNotifications",
  }),
  subscription: one(userSubscription),
}));

export const subscriptionPlansRelations = relations(
  subscriptionPlan,
  ({ many }) => ({
    userSubscriptions: many(userSubscription),
  }),
);

export const userSubscriptionsRelations = relations(
  userSubscription,
  ({ one }) => ({
    user: one(user, {
      fields: [userSubscription.userId],
      references: [user.id],
    }),
    plan: one(subscriptionPlan, {
      fields: [userSubscription.planId],
      references: [subscriptionPlan.id],
    }),
  }),
);

export const followRequestsRelations = relations(
  followRequest,
  ({ one, many }) => ({
    follower: one(user, {
      fields: [followRequest.followerId],
      references: [user.id],
      relationName: "sentFollowRequests",
    }),
    following: one(user, {
      fields: [followRequest.followingId],
      references: [user.id],
      relationName: "receivedFollowRequests",
    }),
    notifications: many(notification),
  }),
);

export const followsRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "followers",
  }),
  following: one(user, {
    fields: [follow.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));

export const blocksRelations = relations(block, ({ one }) => ({
  blocker: one(user, {
    fields: [block.blockerId],
    references: [user.id],
    relationName: "blockedUsers",
  }),
  blocked: one(user, {
    fields: [block.blockedId],
    references: [user.id],
    relationName: "blockedByUsers",
  }),
}));

export const postsRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
  sharedPost: one(post, {
    fields: [post.sharedPostId],
    references: [post.id],
    relationName: "sharedPost",
  }),
  sharesOfThisPost: many(post, { relationName: "sharedPost" }),
  images: many(postImage),
  comments: many(comment),
  likes: many(like),
  shares: many(share),
  notifications: many(notification),
}));

export const postImagesRelations = relations(postImage, ({ one }) => ({
  post: one(post, {
    fields: [postImage.postId],
    references: [post.id],
  }),
}));

export const commentsRelations = relations(comment, ({ one, many }) => ({
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  parentComment: one(comment, {
    fields: [comment.parentCommentId],
    references: [comment.id],
    relationName: "parentComment",
  }),
  replies: many(comment, { relationName: "parentComment" }),
  likes: many(like),
  notifications: many(notification),
}));

export const likesRelations = relations(like, ({ one }) => ({
  user: one(user, {
    fields: [like.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
  comment: one(comment, {
    fields: [like.commentId],
    references: [comment.id],
  }),
}));

export const sharesRelations = relations(share, ({ one }) => ({
  user: one(user, {
    fields: [share.userId],
    references: [user.id],
  }),
  originalPost: one(post, {
    fields: [share.originalPostId],
    references: [post.id],
  }),
}));

export const notificationsRelations = relations(notification, ({ one }) => ({
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
