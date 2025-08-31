import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import user from "./user";
import comment from "./comment";
import { uuidv7 } from "uuidv7";

const commentMention = pgTable(
  "comment_mention",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    mentionedUserId: text("mentioned_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("comment_mentions_comment_user_idx").on(
      table.commentId,
      table.mentionedUserId,
    ),
    index("comment_mentions_user_idx").on(table.mentionedUserId),
  ],
);

export const commentMentionRelations = relations(commentMention, ({ one }) => ({
  comment: one(comment, {
    fields: [commentMention.commentId],
    references: [comment.id],
  }),
  mentionedUser: one(user, {
    fields: [commentMention.mentionedUserId],
    references: [user.id],
  }),
}));

export default commentMention;
