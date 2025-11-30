import { client } from "@web/lib/api-client";
import { useQuery } from "@tanstack/react-query";

const fetchSystemSettings = async () => {
  const { data, error } = await client.api.settings.get();
  if (error) throw error.status;
  return data;
};

export const useGetSystemSettings = () => {
  return useQuery({
    queryKey: ["systemSettings"],
    queryFn: fetchSystemSettings,
  });
};
