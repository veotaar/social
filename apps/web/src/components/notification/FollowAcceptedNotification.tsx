import type { NotificationProps } from "./types";
import { Link } from "@tanstack/react-router";
import NotificationItem from "./NotificationItem";
import { useMarkAsRead } from "./useMarkAsRead";

const FollowAcceptedNotification = ({ notification }: NotificationProps) => {
  const { sender } = notification;

  const { mutate: markAsRead } = useMarkAsRead();

  if (!sender) {
    return null;
  }

  return (
    <NotificationItem notification={notification}>
      <Link
        className="link font-bold text-base-content"
        to="/users/$userid"
        params={{ userid: sender.id }}
        onClick={() =>
          markAsRead({
            userid: notification.notification.recipientId,
            notificationid: notification.notification.id,
          })
        }
      >
        {sender.displayUsername}
      </Link>{" "}
      accepted your follow request!
    </NotificationItem>
  );
};

export default FollowAcceptedNotification;
