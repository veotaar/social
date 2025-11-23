import React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { client } from "@web/lib/api-client";
import { QueryClient, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "@web/lib/auth-client";
import { UserPen } from "lucide-react";
import Avatar from "@web/components/avatar/Avatar";
import FollowButton from "@web/components/follow-button/FollowButton";
import OptionsButton from "@web/components/options-button/OptionsButton";
import Post from "@web/components/post/Post";
import { Navigate } from "@tanstack/react-router";
import { FollowRequestItem } from "@web/components/follow-request/FollowRequest";
import { useGetFollowRequests } from "@web/hooks/useGetFollowRequests";

export const Route = createFileRoute("/users/$userid/")({
  component: RouteComponent,
  loader: async ({ params: { userid }, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["user", userid],
      queryFn: async () => {
        const { data, error } = await client.users({ userid }).get();
        if (error) throw notFound();
        return data;
      },
    });
  },
  notFoundComponent: () => (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <p className="text-error">User not found</p>
      <Link to="/" className="btn btn-primary mt-4">
        Go to feed
      </Link>
    </div>
  ),
});

function RouteComponent() {
  const { userid } = Route.useParams();

  const { data: sessionData } = useSession();
  const isOwnProfile = sessionData?.user.id === userid;

  const {
    data: userData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", userid],
    queryFn: async () => {
      const { data, error } = await client.users({ userid }).get();
      if (error) throw error.status;
      return data;
    },
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    // enabled: !!userData,
    queryKey: ["userPosts", userid],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await client.users({ userid }).posts.get({
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

  const { data: followRequestsData, isError: isFollowRequestError } =
    useGetFollowRequests();

  const receivedRequest = followRequestsData?.received.find(
    (request) =>
      request.followerId === userid &&
      request.followeeId === sessionData?.user.id,
  );

  if (isLoading) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (isError || !userData || isFollowRequestError || !followRequestsData) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
        <p className="text-error">User not found</p>
        <Navigate to="/" />
      </div>
    );
  }

  const joinDate = new Date(userData.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto mt-4 min-h-screen max-w-3xl p-2">
      <div className="mb-6 rounded-md border border-base-300 bg-base-200 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <Avatar name={userData.name} image={userData.image} size="xl" />

          <div className="grow text-center md:text-left">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="font-bold text-3xl text-base-content">
                  {userData.displayUsername}
                </h1>
                {userData.username && (
                  <p className="mt-1 text-base-content/70 text-lg">
                    @{userData.username}
                  </p>
                )}
              </div>

              {isOwnProfile && (
                <Link to="/users/edit" className="btn btn-outline gap-2">
                  <UserPen className="h-4 w-4" />
                  Edit Profile
                </Link>
              )}
              {!isOwnProfile && (
                <div className="flex items-center gap-2">
                  <OptionsButton user={userData} />

                  <FollowButton
                    userId={userid}
                    isFollowedBy={userData.isFollowedBy}
                    isFollowing={userData.isFollowing}
                    isBlocked={userData.isBlocked}
                  />
                </div>
              )}
            </div>

            <p className="text-base-content/70 italic">
              {userData.isFollowing && userData.isFollowedBy
                ? "You are following each other."
                : userData.isFollowedBy
                  ? "Follows you."
                  : ""}
            </p>

            {userData.bio && (
              <p className="mt-4 max-w-2xl text-base-content/80">
                {userData.bio}
              </p>
            )}

            <p className="mt-3 text-base-content/60 text-sm">
              Joined {joinDate}
            </p>

            {userData.banned && (
              <div className="badge badge-error mt-3 gap-2">Banned</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-base-300 border-t pt-6 md:grid-cols-4">
          <div className="text-center">
            <p className="font-bold text-2xl text-base-content">
              {userData.postsCount ?? 0}
            </p>
            <p className="text-base-content/70 text-sm">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl text-base-content">
              {userData.commentsCount ?? 0}
            </p>
            <p className="text-base-content/70 text-sm">Comments</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl text-base-content">
              {userData.followersCount ?? 0}
            </p>
            <p className="text-base-content/70 text-sm">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl text-base-content">
              {userData.followingCount ?? 0}
            </p>
            <p className="text-base-content/70 text-sm">Following</p>
          </div>
        </div>

        {/* Follow Requests */}
        {!isOwnProfile && receivedRequest && (
          <div className="mt-4 rounded-md bg-info p-2">
            <p className="mb-2 text-info-content text-lg">
              This user has sent you a follow request:
            </p>
            <FollowRequestItem
              request={receivedRequest}
              requestType="received"
            />
          </div>
        )}
      </div>

      {userData.isBlocked && (
        <div className="mb-6 rounded-md border border-base-300 bg-error p-4 text-center text-error-content">
          You have blocked this user. You won't see their posts or comments.
        </div>
      )}

      {/* Posts Section */}
      <div className="bg-base-100">
        {/* <h2 className="mb-4 font-bold text-2xl text-base-content">
          Posts by the user
        </h2> */}

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
