import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import post from "./post";
import { uuidv7 } from "uuidv7";

const postMention = pgTable(
  "post_mention",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    mentionedUserId: text("mentioned_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("post_mentions_post_user_idx").on(
      table.postId,
      table.mentionedUserId,
    ),
    index("post_mentions_user_idx").on(table.mentionedUserId),
  ],
);

export const postMentionRelations = relations(postMention, ({ one }) => ({
  post: one(post, { fields: [postMention.postId], references: [post.id] }),
  mentionedUser: one(user, {
    fields: [postMention.mentionedUserId],
    references: [user.id],
  }),
}));

export default postMention;
