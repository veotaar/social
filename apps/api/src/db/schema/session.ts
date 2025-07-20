import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import user from "./user";
import { uuidv7 } from "uuidv7";

const session = pgTable("session", {
  id: text("id")
    .$defaultFn(() => uuidv7())
    .primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export default session;
