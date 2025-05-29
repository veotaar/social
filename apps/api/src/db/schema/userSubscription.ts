import {
  pgTable,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import subscriptionPlan from "./subscriptionPlan";

export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
  "pending",
]);

const userSubscription = pgTable(
  "user_subscription",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlan.id),
    status: subscriptionStatus("status").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    autoRenew: boolean("auto_renew").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
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
