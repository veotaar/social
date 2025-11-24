import { admin } from "@web/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const removeUser = async (userId: string) => {
  const { data, error } = await admin.removeUser({
    userId,
  });

  if (error || !data) {
    throw new Error("Failed to ban user");
  }

  return data;
};

export const useRemoveUser = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ["remove-user"],
    mutationFn: removeUser,
    onSuccess: () => {
      navigate({ to: "/" });
    },
  });
};
