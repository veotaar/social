import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import user from "./user";

const twoFactor = pgTable("two_factor", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export default twoFactor;
