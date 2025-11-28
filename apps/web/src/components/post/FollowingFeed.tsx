import { useInfiniteQuery } from "@tanstack/react-query";
import Post from "@web/components/post/Post";
import { client } from "@web/lib/api-client";
import { useVirtualizedInfiniteFeed } from "@web/hooks/useVirtualizedInfiniteFeed";
import { cn } from "@web/lib/utils";

const FollowingFeed = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ["posts", "following"],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await client.posts.following.get({
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

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  const { virtualItems, totalSize, measureElement } =
    useVirtualizedInfiniteFeed({
      items: allPosts,
      hasNextPage: !!hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    });

  if (status === "pending") {
    return <p>Loading...</p>;
  }

  if (status === "error") {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div>
      <div
        style={{
          height: `${totalSize}px`,
          width: "100%",
          position: "relative",
          contain: "strict",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const post = allPosts[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translate3d(0, ${virtualRow.start}px, 0)`,
              }}
            >
              <Post post={post} />
            </div>
          );
        })}
      </div>
      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}
      {!hasNextPage && allPosts.length > 0 && (
        <div className="py-4 text-center text-base-content/60">
          Nothing more to load
        </div>
      )}
    </div>
  );
};

export default FollowingFeed;
