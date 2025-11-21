import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

type DecideFollowRequestParams = {
  followRequestId: string;
  decision: "accepted" | "rejected" | "cancelled";
  userId: string;
};

const decideFollowRequest = async ({
  followRequestId,
  decision,
  userId,
}: DecideFollowRequestParams) => {
  const { data, error } = await client
    .users({ userid: userId })
    .followRequests({ followRequestId })
    .status.put({ status: decision });

  if (error) throw new Error("Failed to send follow request");

  return data;
};

export const useDecideFollowRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["decideFollowRequest"],
    mutationFn: (params: DecideFollowRequestParams) => {
      return decideFollowRequest(params);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["followRequests"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      await queryClient.refetchQueries({
        queryKey: ["followRequest"],
      });

      await queryClient.refetchQueries({
        queryKey: ["user"],
      });
    },
  });
};
