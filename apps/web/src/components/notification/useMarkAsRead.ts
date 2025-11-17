import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

type MarkNotificationAsReadParams = {
  userid: string;
  notificationid: string;
};

const markNotificationAsRead = async ({
  userid,
  notificationid,
}: MarkNotificationAsReadParams) => {
  const { data, error } = await client
    .users({ userid })
    .notifications({ notificationid })
    .read.put();

  if (error) throw new Error("Failed to delete notification");

  return data;
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteNotification"],
    mutationFn: (params: MarkNotificationAsReadParams) => {
      return markNotificationAsRead(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
};
