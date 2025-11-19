import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

const mutualUnfollow = async ({
  currentUserId,
  targetUserId,
}: { currentUserId: string; targetUserId: string }) => {
  const { data, error } = await client
    .users({ userid: currentUserId })
    .connections({ targetuserid: targetUserId })
    .delete();

  if (error) throw new Error("Failed to mutually unfollow");

  return data;
};

export const useMutualUnfollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["mutualUnfollowUser"],
    mutationFn: mutualUnfollow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });
};
