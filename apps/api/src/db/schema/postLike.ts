import {
  pgTable,
  timestamp,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import { uuidv7 } from "uuidv7";

const postLike = pgTable(
  "post_like",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
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
    uniqueIndex("post_likes_user_post_idx").on(table.userId, table.postId),
    index("post_likes_user_id_idx").on(table.userId),
    index("post_likes_post_id_idx").on(table.postId),
  ],
);

export const postLikeRelations = relations(postLike, ({ one }) => ({
  user: one(user, {
    fields: [postLike.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [postLike.postId],
    references: [post.id],
  }),
}));

export default postLike;
