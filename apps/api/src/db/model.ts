// import { table } from "./schema";
import { spreads } from "./utils";
import { t } from "elysia";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

import account from "./schema/account";
import block, { blockRelations } from "./schema/block";
import comment, { commentRelations } from "./schema/comment";
import follow, { followRelations } from "./schema/follow";
import followRequest, {
  followRequestRelations,
  followRequestStatus,
} from "./schema/followRequest";
import like, { likeRelations } from "./schema/like";
import notification, {
  notificationRelations,
  notificationType,
} from "./schema/notification";
import post, { postRelations } from "./schema/post";
import postImage, { postImageRelations } from "./schema/postImage";
import session from "./schema/session";
import share, { shareRelations } from "./schema/share";
import subscriptionPlan, {
  subscriptionPlanRelations,
  subscriptionPlanType,
} from "./schema/subscriptionPlan";
import twoFactor from "./schema/twoFactor";
import user, { userRelations } from "./schema/user";
import userSubscription, {
  userSubscriptionRelations,
  subscriptionStatus,
} from "./schema/userSubscription";
import verification from "./schema/verification";

export const table = {
  account,
  block,
  comment,
  follow,
  followRequest,
  like,
  notification,
  post,
  postImage,
  session,
  share,
  subscriptionPlan,
  twoFactor,
  user,
  userSubscription,
  verification,
  blockRelations,
  commentRelations,
  followRelations,
  followRequestRelations,
  followRequestStatus,
  likeRelations,
  notificationRelations,
  notificationType,
  postRelations,
  postImageRelations,
  shareRelations,
  subscriptionPlanRelations,
  subscriptionPlanType,
  userRelations,
  userSubscriptionRelations,
  subscriptionStatus,
} as const;

export type Table = typeof table;

export const db = {
  insert: spreads(
    {
      post: createInsertSchema(table.post, {
        content: t.String({ maxLength: 10000 }),
      }),
      comment: createInsertSchema(table.comment, {
        content: t.String({ maxLength: 5000 }),
      }),
      block: createInsertSchema(table.block),
    },
    "insert",
  ),
  select: spreads(
    {
      post: createSelectSchema(table.post, {
        id: t.String({ format: "uuid" }),
      }),
      comment: createSelectSchema(table.comment, {
        id: t.String({ format: "uuid" }),
      }),
    },
    "select",
  ),
} as const;
