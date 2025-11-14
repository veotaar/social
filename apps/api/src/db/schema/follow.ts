import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "@api/db/schema/user";
import { uuidv7 } from "uuidv7";

const follow = pgTable(
  "follow",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("follows_follower_followee_idx").on(
      table.followerId,
      table.followeeId,
    ),
    index("follows_follower_id_idx").on(table.followerId),
    index("follows_followee_id_idx").on(table.followeeId),
  ],
);

export const followRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "followers",
  }),
  followee: one(user, {
    fields: [follow.followeeId],
    references: [user.id],
    relationName: "following",
  }),
}));

export default follow;
