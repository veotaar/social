import { useQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { useSession } from "@web/lib/auth-client";

export const getFollowRequests = async (userId: string) => {
  const { data, error } = await client
    .users({ userid: userId })
    .followRequests.get();

  if (error) throw new Error("Failed to fetch follow requests");

  return data;
};

export const useGetFollowRequests = () => {
  const { data } = useSession();

  return useQuery({
    queryKey: ["followRequests", data?.user?.id],
    // biome-ignore lint/style/noNonNullAssertion: queryFn only runs when enabled is true
    queryFn: () => getFollowRequests(data!.user.id),
    enabled: !!data?.user?.id,
  });
};
