import { useEffect, useState } from "react";
import { client } from "@web/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { Treaty } from "@elysiajs/eden";
import { useSession } from "@web/lib/auth-client";
import { useUpdateAdminSettings } from "./useUpdateAdminSettings";

type AdminSettings = Treaty.Data<typeof client.api.admin.settings.get>;

export function AdminSettings() {
  const { data: userData } = useSession();
  const [showSaved, setShowSaved] = useState(false);

  const {
    data: settingsData,
    isLoading,
    isError,
  } = useQuery({
    enabled: userData?.user.role === "admin",
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await client.api.admin.settings.get();
      if (error) throw error.status;
      return data;
    },
  });

  const { mutate: updateSettings, isSuccess } = useUpdateAdminSettings();

  useEffect(() => {
    if (isSuccess) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleToggle = (
    field: "allowSignup" | "allowGuestLogin" | "maintenanceMode",
  ) => {
    if (!settingsData) return;
    updateSettings({ [field]: !settingsData[field] });
  };

  const handleGuestPostLimitChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number.parseInt(e.target.value, 10);
    if (Number.isNaN(value) || value < 0) return;
    updateSettings({ guestPostLimit: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError || !settingsData) {
    return (
      <div className="alert alert-error">
        <span>Error loading admin settings.</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body">
        <div className="flex items-center gap-3">
          <h1 className="card-title text-2xl">Admin Settings</h1>
          {showSaved && (
            <span className="animate-pulse font-medium text-sm text-success">
              Saved!
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settingsData.allowSignup}
                onChange={() => handleToggle("allowSignup")}
                // disabled={isPending}
              />
              <div>
                <span className="label-text font-medium text-base-content">
                  Allow Signup
                </span>
                <p className="text-sm">
                  Allow new users to register on the platform
                </p>
              </div>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={settingsData.allowGuestLogin}
                onChange={() => handleToggle("allowGuestLogin")}
                // disabled={isPending}
              />
              <div>
                <span className="label-text font-medium text-base-content">
                  Allow Guest Login
                </span>
                <p className="text-sm">
                  Allow users to browse the platform as guests
                </p>
              </div>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-warning"
                checked={settingsData.maintenanceMode}
                onChange={() => handleToggle("maintenanceMode")}
                // disabled={isPending}
              />
              <div>
                <span className="label-text font-medium text-base-content">
                  Maintenance Mode
                </span>
                <p className="text-sm">Put the platform in maintenance mode</p>
              </div>
            </label>
          </div>

          <div className="form-control">
            <label className="label" htmlFor="guestPostLimit">
              <input
                id="guestPostLimit"
                type="number"
                className="input input-bordered w-12 rounded"
                value={settingsData.guestPostLimit}
                onChange={handleGuestPostLimitChange}
                min={0}
                // disabled={isPending}
              />
              <div>
                <span className="label-text font-medium text-base-content">
                  Guest Post Limit
                </span>
                <p className="text-sm">
                  Maximum number of posts a guest can create
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
