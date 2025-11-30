import { client } from "@web/lib/api-client";
import type { Treaty } from "@elysiajs/eden";

const notificationRequest = client.api.users({ userid: "string" }).notifications
  .get;

export type NotificationData = Omit<
  Treaty.Data<typeof notificationRequest>,
  "pagination"
>["notifications"][number];

export type NotificationProps = {
  notification: NotificationData;
};
