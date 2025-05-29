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

export const subscriptionPlanType = pgEnum("subscription_plan_type", [
  "free",
  "premium",
  "pro",
]);

const subscriptionPlan = pgTable("subscription_plan", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  name: varchar("name", { length: 50 }).notNull(),
  type: subscriptionPlanType("type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in days
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionPlanRelations = relations(
  subscriptionPlan,
  ({ many }) => ({
    userSubscriptions: many(userSubscription),
  }),
);

export default subscriptionPlan;
