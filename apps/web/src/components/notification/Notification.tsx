import LikeNotification from "./LikeNotification";
import CommentNotification from "./CommentNotification";
import FollowRequestNotification from "./FollowRequestNotification";
import NotificationItem from "./NotificationItem";
import type { NotificationProps } from "./types";
import FollowAcceptedNotification from "./FollowAcceptedNotification";

const Notification = ({ notification }: NotificationProps) => {
  if (notification.notification.type === "follow_request") {
    return <FollowRequestNotification notification={notification} />;
  }

  if (notification.notification.type.endsWith("_like")) {
    return <LikeNotification notification={notification} />;
  }

  if (notification.notification.type === "comment") {
    return <CommentNotification notification={notification} />;
  }

  if (notification.notification.type === "follow_accepted") {
    return <FollowAcceptedNotification notification={notification} />;
  }

  return null;
};

export default Notification;
