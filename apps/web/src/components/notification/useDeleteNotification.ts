import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

type DeleteNotificationParams = {
  userid: string;
  notificationid: string;
};

const deleteNotification = async ({
  userid,
  notificationid,
}: DeleteNotificationParams) => {
  const { data, error } = await client
    .users({ userid })
    .notifications({ notificationid })
    .delete();

  if (error) throw new Error("Failed to delete notification");

  return data;
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteNotification"],
    mutationFn: (params: DeleteNotificationParams) => {
      return deleteNotification(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
};
