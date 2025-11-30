import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

async function unblockUser({ userId }: { userId: string }) {
  const { data, error } = await client.api.block({ id: userId }).delete();

  if (error) throw new Error("Failed to send comment");

  return data;
}

export function useUnblockUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["un-block-user", userId],
    mutationFn: () => unblockUser({ userId }),
    // onSuccess: async () => {
    //   queryClient.invalidateQueries({
    //     queryKey: ["blockedAccounts"],
    //   });
    // },
  });
}
