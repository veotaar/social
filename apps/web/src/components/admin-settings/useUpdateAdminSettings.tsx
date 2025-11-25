import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import type { Treaty } from "@elysiajs/eden";

type AdminSettingsUpdate = Omit<
  Treaty.Data<typeof client.admin.settings.patch>,
  "id" | "updatedAt"
>;

type AdminSettingsResponse = Treaty.Data<typeof client.admin.settings.patch>;

type SettingsPatch = Partial<AdminSettingsUpdate>;

const updateAdminSettings = async (settings: SettingsPatch) => {
  const { data, error } = await client.admin.settings.patch(settings);
  if (error) throw error.status;
  return data;
};

export const useUpdateAdminSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminSettings,
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ["adminSettings"] });

      const previousSettings = queryClient.getQueryData<AdminSettingsResponse>([
        "adminSettings",
      ]);

      queryClient.setQueryData<AdminSettingsResponse>(
        ["adminSettings"],
        (old) => (old ? { ...old, ...newSettings } : old),
      );

      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(["adminSettings"], context.previousSettings);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["adminSettings"], data);
    },
  });
};
