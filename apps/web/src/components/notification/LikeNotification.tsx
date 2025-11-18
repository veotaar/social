import type { NotificationProps } from "./types";
import { Link } from "@tanstack/react-router";
import NotificationItem from "./NotificationItem";

const LikeNotification = ({ notification }: NotificationProps) => {
  const {
    sender,
    notification: { postId, commentId, type },
  } = notification;

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
          className="link link-hover font-bold text-primary"
          to="/posts/$postid/comments/$commentid"
          params={{ postid: postId, commentid: commentId }}
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
          className="link link-hover font-bold text-primary"
          to="/posts/$postid"
          params={{ postid: postId }}
        >
          Post
        </Link>
      </NotificationItem>
    );
  }

  return null;
};

export default LikeNotification;
