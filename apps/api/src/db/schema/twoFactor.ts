import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import user from "./user";
import { uuidv7 } from "uuidv7";

const twoFactor = pgTable("two_factor", {
  id: text("id")
    .$defaultFn(() => uuidv7())
    .primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export default twoFactor;
