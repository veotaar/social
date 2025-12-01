import {
  pgTable,
  timestamp,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import comment from "./comment";
import post from "./post";

const commentLike = pgTable(
  "comment_like",
  {
    id: text("id").default(sql`uuidv7()`).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("comment_likes_user_comment_idx").on(
      table.userId,
      table.commentId,
    ),
    index("comment_likes_user_id_idx").on(table.userId),
    index("comment_likes_comment_id_idx").on(table.commentId),
  ],
);

export const commentLikeRelations = relations(commentLike, ({ one }) => ({
  user: one(user, {
    fields: [commentLike.userId],
    references: [user.id],
  }),
  comment: one(comment, {
    fields: [commentLike.commentId],
    references: [comment.id],
  }),
}));

export default commentLike;
