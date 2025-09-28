import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  varchar,
  decimal,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import userSubscription from "./userSubscription";
import { uuidv7 } from "uuidv7";

export const subscriptionPlanType = pgEnum("subscription_plan_type", [
  "free",
  "premium",
  "pro",
]);

const subscriptionPlan = pgTable("subscription_plan", {
  id: text("id")
    .$defaultFn(() => uuidv7())
    .primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  type: subscriptionPlanType("type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in days
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
    .notNull(),
});

export const subscriptionPlanRelations = relations(
  subscriptionPlan,
  ({ many }) => ({
    userSubscriptions: many(userSubscription),
  }),
);

export default subscriptionPlan;
