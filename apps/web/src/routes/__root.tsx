import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Navbar } from "@web/components/Navbar";
import { Sidebar } from "@web/components/sidebar/Sidebar";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <div className="flex max-h-svh">
        <Sidebar />
        <div className="grow overflow-scroll">
          <Outlet />
        </div>
      </div>
      {/* <Navbar /> */}
      {/* <TanStackRouterDevtools /> */}
      <ReactQueryDevtools />
    </>
  );
}
