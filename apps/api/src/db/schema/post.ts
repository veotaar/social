import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import comment from "./comment";
import like from "./like";
import share from "./share";
import postImage from "./postImage";
import notification from "./notification";

const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content"),
    sharedPostId: uuid("shared_post_id"),
    shareComment: text("share_comment"),
    likesCount: integer("likes_count").default(0),
    commentsCount: integer("comments_count").default(0),
    sharesCount: integer("shares_count").default(0),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("posts_author_id_idx").on(table.authorId),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_is_deleted_idx").on(table.isDeleted),
    foreignKey({
      columns: [table.sharedPostId],
      foreignColumns: [table.id],
      name: "fk_share_id",
    }),
  ],
);

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
  sharedPost: one(post, {
    fields: [post.sharedPostId],
    references: [post.id],
    relationName: "sharedPost",
  }),
  sharesOfThisPost: many(post, { relationName: "sharedPost" }),
  images: many(postImage),
  comments: many(comment),
  likes: many(like),
  shares: many(share),
  notifications: many(notification),
}));

export default post;
