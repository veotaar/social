import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import user from "./user";
import post from "./post";
import comment from "./comment";
import { uuidv7 } from "uuidv7";

const like = pgTable(
  "like",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: text("post_id").references(() => post.id, {
      onDelete: "cascade",
    }),
    commentId: text("comment_id").references(() => comment.id, {
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
