import React from "react";
import {
  createFileRoute,
  redirect,
  notFound,
  Link,
} from "@tanstack/react-router";
import { client } from "@web/lib/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@web/lib/utils";
import NotificationList from "@web/components/notification/NotificationList";

export const Route = createFileRoute("/notifications")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/notifications" },
      });
    }
  },
  loader: async ({ context: { auth, queryClient } }) => {
    return await queryClient.ensureInfiniteQueryData({
      queryKey: ["notifications"],
      queryFn: async ({ pageParam }) => {
        const { data, error } = await client
          // biome-ignore lint/style/noNonNullAssertion: loader only runs when user is authenticated
          .users({ userid: auth.user!.id })
          .notifications.get({
            query: { cursor: pageParam },
          });
        if (error) throw notFound();

        return data;
      },
      initialPageParam: "initial",
    });
  },
  notFoundComponent: () => (
    <div className="m-auto mt-12 min-h-svh max-w-3xl p-2">
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="font-medium text-error text-lg">
          Error fetching notifications
        </p>
        <Link to="/" className="link">
          Go back to feed
        </Link>
      </div>
    </div>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { auth } = Route.useRouteContext();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      staleTime: 0,
      queryKey: ["notifications"],
      queryFn: async ({ pageParam }) => {
        const { data, error } = await client
          // biome-ignore lint/style/noNonNullAssertion: component only renders when user is authenticated
          .users({ userid: auth.user!.id })
          .notifications.get({
            query: { cursor: pageParam },
          });
        if (error) throw error.status;

        return data;
      },
      initialPageParam: "initial",
      getNextPageParam: (lastPage) => {
        const hasMore = lastPage.pagination.hasMore;
        if (!hasMore) return undefined;
        return lastPage.pagination.nextCursor;
      },
    });

  const hasNotifications = data?.pages.some(
    (page) => page.notifications.length > 0,
  );

  return (
    <div className="m-auto mt-12 min-h-svh max-w-3xl p-2">
      {!hasNotifications ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="font-medium text-lg">No notifications yet</p>
          <p className="text-base-content/70">
            Your notifications will appear here
          </p>
        </div>
      ) : (
        <>
          <h2 className="font-bold text-2xl">Notifications</h2>

          {data?.pages.map((group) => (
            <React.Fragment key={group.pagination.nextCursor ?? "final"}>
              <NotificationList notifications={group.notifications} />
            </React.Fragment>
          ))}
          {hasNextPage && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
