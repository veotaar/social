import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "@api/db/schema/user";
import { uuidv7 } from "uuidv7";

const block = pgTable(
  "block",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("blocks_blocker_blocked_idx").on(
      table.blockerId,
      table.blockedId,
    ),
    index("blocks_blocker_id_idx").on(table.blockerId),
    index("blocks_blocked_id_idx").on(table.blockedId),
  ],
);

export const blockRelations = relations(block, ({ one }) => ({
  blocker: one(user, {
    fields: [block.blockerId],
    references: [user.id],
    relationName: "blockedUsers",
  }),
  blocked: one(user, {
    fields: [block.blockedId],
    references: [user.id],
    relationName: "blockedByUsers",
  }),
}));

export default block;
