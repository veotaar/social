import {
  pgTable,
  boolean,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  allowSignup: boolean("allow_signup").default(true).notNull(),
  allowGuestLogin: boolean("allow_guest_login").default(false).notNull(),
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  guestPostLimit: integer("guest_post_limit").default(5).notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
    .notNull(),
});

export default systemSettings;
