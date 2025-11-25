import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSettings } from "@web/components/admin-settings/AdminSettings";

export const Route = createFileRoute("/admin.settings")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated || auth.user?.role !== "admin") {
      throw redirect({
        to: "/login",
        search: { redirect: "/" },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="m-auto mt-12 h-full max-w-3xl p-2">
      <AdminSettings />
    </div>
  );
}
