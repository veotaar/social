import {
  pgTable,
  timestamp,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import notification from "./notification";

export const followRequestStatus = pgEnum("follow_request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

const followRequest = pgTable(
  "follow_request",
  {
    id: text("id").default(sql`uuidv7()`).primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: followRequestStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    index("follow_requests_follower_id_idx").on(table.followerId),
    index("follow_requests_followee_id_idx").on(table.followeeId),
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
      fields: [followRequest.followeeId],
      references: [user.id],
      relationName: "receivedFollowRequests",
    }),
    notifications: many(notification),
  }),
);

export default followRequest;
