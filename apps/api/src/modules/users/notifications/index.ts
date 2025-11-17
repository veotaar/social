import { db as model } from "@api/db/model";
import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "@api/modules/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markNotificationsAsRead,
} from "./service";
import { ForbiddenError } from "@api/lib/error";

const { user } = model.select;

export const notificationsRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
    }),
  })
  .get(
    "/users/:userid/notifications",
    async ({ user, params: { userid }, query: { cursor } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Access denied");
      }

      const notifications = await getNotifications({
        currentUserId: userid,
        cursor: cursor,
      });

      return notifications;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  )
  .put(
    "/users/:userid/notifications/read",
    async ({ user, params: { userid }, body: { notificationIds } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Access denied");
      }

      const result = await markNotificationsAsRead({
        currentUserId: userid,
        notificationIds,
      });

      return result;
    },
    {
      body: t.Object({
        notificationIds: t.Array(t.String(), { minItems: 1, maxItems: 10 }),
      }),
    },
  )
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
      notificationid: t.String(),
    }),
  })
  .put(
    "/users/:userid/notifications/:notificationid/read",
    async ({ user, params: { userid, notificationid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Access denied");
      }

      const updatedNotification = await markNotificationAsRead({
        notificationId: notificationid,
        currentUserId: userid,
      });

      if (!updatedNotification) {
        throw new NotFoundError("Notification not found");
      }

      return updatedNotification;
    },
  )
  .delete(
    "/users/:userid/notifications/:notificationid/read",
    async ({ user, params: { userid, notificationid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Access denied");
      }

      const updatedNotification = await markNotificationAsUnread({
        notificationId: notificationid,
        currentUserId: userid,
      });

      if (!updatedNotification) {
        throw new NotFoundError("Notification not found");
      }

      return updatedNotification;
    },
  );
