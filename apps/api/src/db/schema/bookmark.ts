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
import post from "@api/db/schema/post";
import { randomUUIDv7 } from "bun";

const bookmark = pgTable(
  "bookmark",
  {
    id: text("id")
      .$defaultFn(() => randomUUIDv7())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("bookmarks_user_post_idx").on(table.userId, table.postId),
    index("bookmarks_user_id_idx").on(table.userId),
    index("bookmarks_post_id_idx").on(table.postId),
  ],
);

export const bookmarkRelations = relations(bookmark, ({ one }) => ({
  user: one(user, {
    fields: [bookmark.userId],
    references: [user.id],
    relationName: "bookmarks",
  }),
  post: one(post, {
    fields: [bookmark.postId],
    references: [post.id],
    relationName: "bookmarkedBy",
  }),
}));

export default bookmark;
