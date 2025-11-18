import type { NotificationProps } from "./types";
import { Link } from "@tanstack/react-router";
import NotificationItem from "./NotificationItem";

const CommentNotification = ({ notification }: NotificationProps) => {
  const {
    notification: { postId },
    sender,
  } = notification;

  if (!sender || !postId) {
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
      commented on your{" "}
      <Link
        className="link link-hover font-bold text-primary"
        to="/posts/$postid"
        params={{ postid: postId }}
      >
        Post
      </Link>
    </NotificationItem>
  );
};

export default CommentNotification;
