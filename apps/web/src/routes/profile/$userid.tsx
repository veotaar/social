import { createFileRoute } from "@tanstack/react-router";
import { client } from "@web/lib/api-client";
import { QueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/profile/$userid")({
  component: RouteComponent,
  loader: async ({ params: { userid }, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["user", userid],
      queryFn: async () => {
        const { data, error } = await client.users({ userid }).get();
        if (error) throw error.status;
        return data;
      },
    });
  },
});

function RouteComponent() {
  const userData = Route.useLoaderData();

  const joinDate = new Date(userData.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6">
      <div className="mb-6 rounded-box bg-base-100 p-6 shadow">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="shrink-0">
            {userData.image ? (
              <img
                src={userData.image}
                alt={userData.name}
                className="h-32 w-32 rounded-full border-4 border-base-300 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-base-300 bg-linear-to-br from-primary to-secondary font-bold text-4xl text-primary-content">
                {userData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="grow text-center md:text-left">
            <h1 className="font-bold text-3xl text-base-content">
              {userData.name}
            </h1>
            {userData.displayUsername && (
              <p className="mt-1 text-base-content/70 text-lg">
                @{userData.displayUsername}
              </p>
            )}
            {userData.username &&
              userData.username !== userData.displayUsername && (
                <p className="text-base-content/60 text-sm">
                  ({userData.username})
                </p>
              )}

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
      </div>

      {/* Posts Section */}
      <div className="rounded-box bg-base-100 p-6 shadow">
        <h2 className="mb-4 font-bold text-2xl text-base-content">Posts</h2>
        {/* TODO: Add user posts here */}
        <p className="py-8 text-center text-base-content/60">
          Posts will be displayed here
        </p>
      </div>
    </div>
  );
}
