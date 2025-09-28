import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import { uuidv7 } from "uuidv7";

const share = pgTable(
  "share",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    originalPostId: text("original_post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
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

export const shareRelations = relations(share, ({ one }) => ({
  user: one(user, {
    fields: [share.userId],
    references: [user.id],
  }),
  originalPost: one(post, {
    fields: [share.originalPostId],
    references: [post.id],
  }),
}));

export default share;
