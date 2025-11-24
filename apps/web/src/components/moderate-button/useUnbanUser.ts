import { admin } from "@web/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const unbanUser = async (userId: string) => {
  const { data, error } = await admin.unbanUser({
    userId,
  });

  if (error || !data) {
    throw new Error("Failed to ban user");
  }

  return data;
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["unban-user"],
    mutationFn: unbanUser,
    onSuccess: (unbannedUser) => {
      queryClient.invalidateQueries({
        queryKey: ["user", unbannedUser.user.id],
      });
    },
  });
};
