import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

const removeFollower = async ({
  currentUserId,
  targetUserId,
}: { currentUserId: string; targetUserId: string }) => {
  const { data, error } = await client
    .users({ userid: currentUserId })
    .followers({ targetuserid: targetUserId })
    .delete();

  if (error) throw new Error("Failed to remove follower");

  return data;
};

export const useRemoveFollower = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["removeFollower"],
    mutationFn: removeFollower,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });
};
