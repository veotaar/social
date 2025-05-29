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

const share = pgTable(
  "share",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    originalPostId: uuid("original_post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("shares_user_original_post_idx").on(
      table.userId,
      table.originalPostId,
    ),
    index("shares_user_id_idx").on(table.userId),
    index("shares_original_post_id_idx").on(table.originalPostId),
  ],
);

export const shareRelations = relations(share, ({ one }) => ({
  user: one(user, {
    fields: [share.userId],
    references: [user.id],
  }),
  originalPost: one(post, {
    fields: [share.originalPostId],
    references: [post.id],
  }),
}));

export default share;
