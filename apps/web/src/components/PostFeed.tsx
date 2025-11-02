import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { cn } from "@web/lib/utils";
import React from "react";
import Post from "./Post";

const PostFeed = () => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["posts", "feed"],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await client.posts.get({
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

  return status === "pending" ? (
    <p>Loading...</p>
  ) : status === "error" ? (
    <p>Error: {error.message}</p>
  ) : (
    <div>
      {data.pages.map((group) => (
        <React.Fragment
          key={group.pagination.hasMore ? group.pagination.nextCursor : "end"}
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
      <div>{isFetching && !isFetchingNextPage ? "Fetching..." : null}</div>
    </div>
  );
};

export default PostFeed;
