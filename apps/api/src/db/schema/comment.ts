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
import like from "./like";
import notification from "./notification";

const comment = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    parentCommentId: uuid("parent_comment_id"),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    likesCount: integer("likes_count").default(0),
    repliesCount: integer("replies_count").default(0),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("comments_author_id_idx").on(table.authorId),
    index("comments_post_id_idx").on(table.postId),
    index("comments_parent_comment_id_idx").on(table.parentCommentId),
    index("comments_created_at_idx").on(table.createdAt),
    index("comments_is_deleted_idx").on(table.isDeleted),
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
  likes: many(like),
  notifications: many(notification),
}));

export default comment;
