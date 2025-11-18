import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Trash2, Check } from "lucide-react";
import { cn } from "@web/lib/utils";
import Avatar from "../avatar/Avatar";
import type { NotificationData } from "./types";
import { useDeleteNotification } from "./useDeleteNotification";
import { useMarkAsRead } from "./useMarkAsRead";

type NotificationItemProps = {
  notification: NotificationData;
  children: React.ReactNode;
};

const NotificationItem = ({
  notification,
  children,
}: NotificationItemProps) => {
  const {
    sender,
    notification: { isRead, createdAt, id, recipientId },
  } = notification;
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: markAsRead } = useMarkAsRead();

  if (!sender) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-4 border-base-200 border-b p-4 transition-colors hover:bg-base-200/50",
        !isRead && "bg-base-200/30",
      )}
    >
      <div className="shrink-0">
        <Link to="/users/$userid" params={{ userid: sender.id }}>
          <Avatar name={sender.name} image={sender.image} size="md" />
        </Link>
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <div className="text-base-content text-sm">{children}</div>
        <p className="mt-1 text-base-content/60 text-xs">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="dropdown dropdown-end">
        <button
          tabIndex={0}
          type="button"
          className="btn btn-ghost btn-circle btn-xs"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <ul
          //  biome-ignore lint/a11y/noNoninteractiveTabindex: daisyUI requires tabindex
          tabIndex={0}
          className="dropdown-content menu z-1 w-52 rounded-box bg-base-100 p-2 shadow"
        >
          {!isRead && (
            <li>
              <button
                type="button"
                onClick={() =>
                  markAsRead({ userid: recipientId, notificationid: id })
                }
              >
                <Check className="h-4 w-4" /> Mark as read
              </button>
            </li>
          )}
          <li>
            <button
              type="button"
              className="text-error"
              onClick={() =>
                deleteNotification({ userid: recipientId, notificationid: id })
              }
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationItem;
