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
// import { createSelectSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";

const post = pgTable(
  "post",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content"),
    sharedPostId: text("shared_post_id"),
    shareComment: text("share_comment"),
    likesCount: integer("likes_count").default(0).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    sharesCount: integer("shares_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`) // TODO: fix other timestamps
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("posts_author_id_idx").on(table.authorId),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_is_deleted_idx").on(table.deletedAt),
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

// export const PostSchema = createSelectSchema(post).shape;

export default post;
