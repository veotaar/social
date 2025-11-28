import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Sidebar } from "@web/components/sidebar/Sidebar";
import type { QueryClient } from "@tanstack/react-query";
import type { AuthContextType } from "@web/lib/auth-context";
import { ScrollProvider, ScrollContainer } from "@web/lib/scroll-context";

type RootRouteContext = {
  queryClient: QueryClient;
  auth: AuthContextType;
};

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ScrollProvider>
      <div className="grid h-svh grid-cols-[auto_1fr] overflow-hidden">
        <div>
          <Sidebar />
        </div>

        <ScrollContainer>
          <Outlet />
        </ScrollContainer>
      </div>
      <TanStackRouterDevtools position="top-right" />
      <ReactQueryDevtools />
    </ScrollProvider>
  );
}
