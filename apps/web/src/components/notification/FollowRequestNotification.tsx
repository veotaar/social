import type { NotificationProps } from "./types";
import { Link } from "@tanstack/react-router";
import NotificationItem from "./NotificationItem";

const FollowRequestNotification = ({ notification }: NotificationProps) => {
  const { recipientId, followRequestId } = notification.notification;
  const { sender } = notification;

  if (!sender || !followRequestId) {
    return null;
  }

  return (
    <NotificationItem notification={notification}>
      <Link
        className="link link-hover font-bold text-base-content"
        to="/users/$userid"
        params={{ userid: sender.id }}
      >
        {sender.displayUsername}
      </Link>{" "}
      sent you a{" "}
      <Link
        className="link link-hover font-bold text-primary"
        to="/users/$userid/follow-requests"
        params={{ userid: recipientId }}
      >
        follow request!
      </Link>
    </NotificationItem>
  );
};

export default FollowRequestNotification;
