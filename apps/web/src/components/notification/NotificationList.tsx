import Notification from "@web/components/notification/Notification";
import type { NotificationData } from "./types";

type NotificationListProps = {
  notifications: NotificationData[];
};

const NotificationList = ({ notifications }: NotificationListProps) => {
  return (
    <div className="flex flex-col">
      {notifications.map((notification) => (
        <Notification
          key={notification.notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
};

export default NotificationList;
