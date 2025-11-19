import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

const unFollowUser = async ({
  currentUserId,
  targetUserId,
}: { currentUserId: string; targetUserId: string }) => {
  const { data, error } = await client
    .users({ userid: currentUserId })
    .following({ targetuserid: targetUserId })
    .delete();

  if (error) throw new Error("Failed to unfollow");

  return data;
};

export const useUnfollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["unfollowUser"],
    mutationFn: unFollowUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });
};
