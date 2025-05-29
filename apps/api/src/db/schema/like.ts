import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import comment from "./comment";

const like = pgTable(
  "like",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => post.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => comment.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("likes_user_post_idx").on(table.userId, table.postId),
    uniqueIndex("likes_user_comment_idx").on(table.userId, table.commentId),
    index("likes_user_id_idx").on(table.userId),
    index("likes_post_id_idx").on(table.postId),
    index("likes_comment_id_idx").on(table.commentId),
  ],
);

export const likeRelations = relations(like, ({ one }) => ({
  user: one(user, {
    fields: [like.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
  comment: one(comment, {
    fields: [like.commentId],
    references: [comment.id],
  }),
}));

export default like;
