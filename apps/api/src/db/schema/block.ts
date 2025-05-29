import {
  pgTable,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "@/db/schema/user";

const block = pgTable(
  "block",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
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
