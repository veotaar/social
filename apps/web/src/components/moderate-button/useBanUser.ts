import { admin } from "@web/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const banUser = async (userId: string) => {
  const { data, error } = await admin.banUser({
    userId,
  });

  if (error || !data) {
    throw new Error("Failed to ban user");
  }

  return data;
};

export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["ban-user"],
    mutationFn: banUser,
    onSuccess: (bannedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", bannedUser.user.id] });
    },
  });
};
