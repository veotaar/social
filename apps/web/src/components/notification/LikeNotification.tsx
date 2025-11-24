import type { NotificationProps } from "./types";
import { Link } from "@tanstack/react-router";
import NotificationItem from "./NotificationItem";
import { useMarkAsRead } from "./useMarkAsRead";

const LikeNotification = ({ notification }: NotificationProps) => {
  const {
    sender,
    notification: { postId, commentId, type },
  } = notification;

  const { mutate: markAsRead } = useMarkAsRead();

  if (!sender) {
    return null;
  }

  if (type === "comment_like" && commentId && postId) {
    return (
      <NotificationItem notification={notification}>
        <Link
          className="link link-hover font-bold text-base-content"
          to="/users/$userid"
          params={{ userid: sender.id }}
        >
          {sender.displayUsername}
        </Link>{" "}
        liked your{" "}
        <Link
          className="link font-bold text-primary"
          to="/posts/$postid"
          params={{ postid: postId }}
          onClick={() =>
            markAsRead({
              userid: notification.notification.recipientId,
              notificationid: notification.notification.id,
            })
          }
        >
          comment
        </Link>
      </NotificationItem>
    );
  }

  if (type === "post_like" && postId) {
    return (
      <NotificationItem notification={notification}>
        <Link
          className="link link-hover font-bold text-base-content"
          to="/users/$userid"
          params={{ userid: sender.id }}
        >
          {sender.displayUsername}
        </Link>{" "}
        liked your{" "}
        <Link
          className="link font-bold text-primary"
          to="/posts/$postid"
          params={{ postid: postId }}
          onClick={() =>
            markAsRead({
              userid: notification.notification.recipientId,
              notificationid: notification.notification.id,
            })
          }
        >
          post
        </Link>
      </NotificationItem>
    );
  }

  return null;
};

export default LikeNotification;
