import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import post from "./post";
import comment from "./comment";
import postLike from "./postLike";
import commentLike from "./commentLike";
import share from "./share";
import followRequest from "./followRequest";
import follow from "./follow";
import block from "./block";
import notification from "./notification";
import userSubscription from "./userSubscription";
import { uuidv7 } from "uuidv7";

const user = pgTable("user", {
  id: text("id")
    .$defaultFn(() => uuidv7())
    .primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => !1)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled"),
  role: text("role").default("user"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  bio: text("bio"),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  postsCount: integer("posts_count").default(0),
  commentsCount: integer("comments_count").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
});

export const userRelations = relations(user, ({ many, one }) => ({
  posts: many(post),
  comments: many(comment),
  postLikes: many(postLike),
  commentLikes: many(commentLike),
  shares: many(share),
  sentFollowRequests: many(followRequest, {
    relationName: "sentFollowRequests",
  }),
  receivedFollowRequests: many(followRequest, {
    relationName: "receivedFollowRequests",
  }),
  followers: many(follow, { relationName: "followers" }),
  following: many(follow, { relationName: "following" }),
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

export default user;
