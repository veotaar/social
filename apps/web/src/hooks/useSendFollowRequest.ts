import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

const sendFollowRequest = async (userId: string) => {
  const { data, error } = await client.api
    .users({ userid: userId })
    .followRequests.post();

  if (error) throw new Error("Failed to send follow request");

  return data;
};

export const useSendFollowRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      return sendFollowRequest(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["followRequests"],
      });
    },
  });
};
