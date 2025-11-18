import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  varchar,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import commentLike from "./commentLike";
import notification from "./notification";
import { uuidv7 } from "uuidv7";

const comment = pgTable(
  "comment",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    parentCommentId: text("parent_comment_id"),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    likesCount: integer("likes_count").default(0).notNull(),
    repliesCount: integer("replies_count").default(0),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("comments_author_id_idx").on(table.authorId),
    index("comments_post_id_idx").on(table.postId),
    index("comments_parent_comment_id_idx").on(table.parentCommentId),
    index("comments_created_at_idx").on(table.createdAt),
    index("comments_is_deleted_idx").on(table.deletedAt),
    foreignKey({
      columns: [table.parentCommentId],
      foreignColumns: [table.id],
      name: "fk_parent_id",
    }),
  ],
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  parentComment: one(comment, {
    fields: [comment.parentCommentId],
    references: [comment.id],
    relationName: "parentComment",
  }),
  replies: many(comment, { relationName: "parentComment" }),
  likes: many(commentLike),
  notifications: many(notification),
}));

export default comment;
