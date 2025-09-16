import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import React from "react";

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
      const { data, error } = await client.post.get({
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
    <>
      {data.pages.map((group) => (
        <React.Fragment
          key={group.pagination.hasMore ? group.pagination.nextCursor : "end"}
        >
          {group.posts.map((post) => (
            <div key={post.post.id}>
              <p className="text-sm text-gray-500">by {post.author?.name}</p>
              <p>{post.post.content}</p>
              <hr />
            </div>
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
    </>
  );
};

export default PostFeed;
