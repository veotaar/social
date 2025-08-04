import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
    followingId: text("following_id")
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

export const followRelations = relations(follow, ({ one }) => ({
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

export default follow;
