import type { NotificationProps } from "./types";
import { Link } from "@tanstack/react-router";
import NotificationItem from "./NotificationItem";

const FollowAcceptedNotification = ({ notification }: NotificationProps) => {
  const { sender } = notification;

  if (!sender) {
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
      accepted your follow request!
    </NotificationItem>
  );
};

export default FollowAcceptedNotification;
