import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import post from "./post";
import comment from "./comment";
import like from "./like";
import share from "./share";
import followRequest from "./followRequest";
import follow from "./follow";
import block from "./block";
import notification from "./notification";
import userSubscription from "./userSubscription";

const user = pgTable("user", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => !1)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled"),
  role: text("role").default("user"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  bio: text("bio"),
  followersCount: integer("followers_count"),
  followingCount: integer("following_count"),
  postsCount: integer("posts_count"),
});

export const userRelations = relations(user, ({ many, one }) => ({
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
