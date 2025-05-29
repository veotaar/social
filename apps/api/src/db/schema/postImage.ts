import {
  pgTable,
  timestamp,
  integer,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import post from "./post";

const postImage = pgTable(
  "post_image",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    altText: varchar("alt_text", { length: 255 }),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("post_images_post_id_idx").on(table.postId),
    uniqueIndex("post_images_post_id_order_idx").on(table.postId, table.order),
  ],
);

export const postImageRelations = relations(postImage, ({ one }) => ({
  post: one(post, {
    fields: [postImage.postId],
    references: [post.id],
  }),
}));

export default postImage;
