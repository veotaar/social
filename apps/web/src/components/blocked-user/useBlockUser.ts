import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

async function blockUser({ userId }: { userId: string }) {
  const { data, error } = await client.block({ id: userId }).post();

  if (error) throw new Error("Failed to send comment");

  return data;
}

export function useBlockUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["block-user", userId],
    mutationFn: () => blockUser({ userId }),
    // onSuccess: () => {
    //   queryClient.invalidateQueries({
    //     queryKey: ["blockedAccounts"],
    //   });
    // },
  });
}
