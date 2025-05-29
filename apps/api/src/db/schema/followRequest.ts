import {
  pgTable,
  timestamp,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import notification from "./notification";

export const followRequestStatus = pgEnum("follow_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

const followRequest = pgTable(
  "follow_request",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: followRequestStatus("status").default("pending"),
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

export const followRequestRelations = relations(
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

export default followRequest;
