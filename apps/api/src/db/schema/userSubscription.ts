import {
  pgTable,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  index,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import subscriptionPlan from "./subscriptionPlan";
import { uuidv7 } from "uuidv7";

export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
  "pending",
]);

const userSubscription = pgTable(
  "user_subscription",
  {
    id: text("id")
      .$defaultFn(() => uuidv7())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => subscriptionPlan.id),
    status: subscriptionStatus("status").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    autoRenew: boolean("auto_renew").default(true),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
      .notNull(),
  },
  (table) => [
    index("user_subscriptions_user_id_idx").on(table.userId),
    index("user_subscriptions_status_idx").on(table.status),
  ],
);

export const userSubscriptionRelations = relations(
  userSubscription,
  ({ one }) => ({
    user: one(user, {
      fields: [userSubscription.userId],
      references: [user.id],
    }),
    plan: one(subscriptionPlan, {
      fields: [userSubscription.planId],
      references: [subscriptionPlan.id],
    }),
  }),
);

export default userSubscription;
