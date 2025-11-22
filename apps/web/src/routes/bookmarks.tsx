import React from "react";
import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { client } from "@web/lib/api-client";
import { QueryClient, useInfiniteQuery } from "@tanstack/react-query";
import Post from "@web/components/post/Post";

export const Route = createFileRoute("/bookmarks")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/bookmarks" },
      });
    }
  },
  loader: async ({ context: { auth, queryClient } }) => {
    return queryClient.ensureInfiniteQueryData({
      queryKey: ["bookmarks"],
      queryFn: async ({ pageParam }) => {
        const { data, error } = await client
          // biome-ignore lint/style/noNonNullAssertion: loader only runs when user is authenticated
          .users({ userid: auth.user!.id })
          .bookmarks.get({ query: { cursor: pageParam } });
        if (error) throw notFound();
        return data;
      },
      initialPageParam: "initial",
    });
  },
  notFoundComponent: () => (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <p className="text-error">Bookmarks not found</p>
      <Link to="/" className="btn btn-primary mt-4">
        Go to feed
      </Link>
    </div>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { auth } = Route.useRouteContext();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["bookmarks"],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await client
        // biome-ignore lint/style/noNonNullAssertion: loader only runs when user is authenticated
        .users({ userid: auth.user!.id })
        .bookmarks.get({ query: { cursor: pageParam } });
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

  const hasBookmarks = data?.pages.some((page) => page.posts.length > 0);

  if (!hasBookmarks) {
    return (
      <div className="m-auto mt-12 h-full max-w-3xl p-2">
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="font-medium text-lg">No bookmarks yet</p>
          <p className="text-base-content/70">
            Your bookmarked posts will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="m-auto mt-12 h-full max-w-3xl p-2">
      <h2 className="font-bold text-2xl">Bookmarks</h2>
      <div className="bg-base-100">
        {status === "pending" ? (
          <p>Loading...</p>
        ) : status === "error" ? (
          <p>Error: {error.message}</p>
        ) : (
          <div>
            {data.pages.map((group) => (
              <React.Fragment
                key={
                  group.pagination.hasMore ? group.pagination.nextCursor : "end"
                }
              >
                {group.posts.map((post) => (
                  <Post key={post.post.id} post={post} />
                ))}
              </React.Fragment>
            ))}
            <div>
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetching}
              >
                {isFetchingNextPage
                  ? "Loading more..."
                  : hasNextPage
                    ? "Load More"
                    : "Nothing more to load"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
