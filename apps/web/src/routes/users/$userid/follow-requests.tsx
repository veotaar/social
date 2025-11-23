import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFollowRequests } from "@web/hooks/useGetFollowRequests";
import { FollowRequestItem } from "@web/components/follow-request/FollowRequest";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/users/$userid/follow-requests")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/users/$userid/follow-requests" },
      });
    }
  },
  loader: async ({ params: { userid }, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["followRequests", userid],
      queryFn: () => getFollowRequests(userid),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { userid } = Route.useParams();

  const {
    data: followRequests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["followRequests", userid],
    queryFn: () => getFollowRequests(userid),
  });

  if (isLoading) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-6">
        <h1 className="mb-6 font-bold text-2xl">Follow Requests</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (isError || !followRequests) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-6">
        <h1 className="mb-6 font-bold text-2xl">Follow Requests</h1>
        <p className="text-error">Failed to load follow requests.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6">
      <h1 className="mb-6 font-bold text-2xl">Follow Requests</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 font-semibold text-xl">Received Requests</h2>
          {followRequests.received.length === 0 ? (
            <p className="text-gray-500">No received requests.</p>
          ) : (
            followRequests.received.map((request) => (
              <div key={request.id} className="mb-2">
                <FollowRequestItem request={request} requestType="received" />
              </div>
            ))
          )}
        </div>

        <div>
          <h2 className="mb-4 font-semibold text-xl">Sent Requests</h2>
          {followRequests.sent.length === 0 ? (
            <p className="text-gray-500">No sent requests.</p>
          ) : (
            followRequests.sent.map((request) => (
              <FollowRequestItem
                key={request.id}
                request={request}
                requestType="sent"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
