import React from "react";
import {
  createFileRoute,
  Link,
  redirect,
  notFound,
} from "@tanstack/react-router";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import BlockedUserEntry from "@web/components/blocked-user/BlockedUserEntry";

export const Route = createFileRoute("/settings/blocked")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/settings/blocked" },
      });
    }
  },
  loader: async ({ context: { auth, queryClient } }) => {
    // biome-ignore lint/style/noNonNullAssertion: loader only runs when user is authenticated
    const { id: userid } = auth.user!;
    return queryClient.ensureInfiniteQueryData({
      queryKey: ["blockedAccounts"],
      queryFn: async ({ pageParam }) => {
        const { data, error } = await client.users({ userid }).blocks.get({
          query: { cursor: pageParam },
        });
        if (error) throw notFound();

        return data;
      },
      initialPageParam: "initial",
    });
  },
  component: RouteComponent,
  notFoundComponent: () => (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <p className="text-error">Blocked accounts not found</p>
      <Link to="/" className="btn btn-primary mt-4">
        Go to feed
      </Link>
    </div>
  ),
});

function RouteComponent() {
  const { auth } = Route.useRouteContext();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      staleTime: 0,
      queryKey: ["blockedAccounts"],
      queryFn: async ({ pageParam }) => {
        // biome-ignore lint/style/noNonNullAssertion: component only renders when user is authenticated
        const { id: userid } = auth.user!;
        const { data, error } = await client.users({ userid }).blocks.get({
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

  const hasBlockedAccounts = data?.pages.some(
    (page) => page.blockedUsers.length > 0,
  );

  return (
    <div className="m-auto min-h-svh max-w-3xl">
      {!hasBlockedAccounts ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="font-medium text-lg">You haven't blocked anyone</p>
          <p className="text-base-content/70">
            Your blocked accounts will appear here
          </p>
        </div>
      ) : (
        <>
          {data?.pages.map((group) => (
            <React.Fragment key={group.pagination.nextCursor ?? "final"}>
              {group.blockedUsers.map((user) => (
                <BlockedUserEntry key={user.id} user={user} />
              ))}
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
