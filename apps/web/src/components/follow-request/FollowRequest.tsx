import { Link } from "@tanstack/react-router";
import Avatar from "../avatar/Avatar";
import { useDecideFollowRequest } from "@web/hooks/useDecideFollowRequest";
import { client } from "@web/lib/api-client";
import type { Treaty } from "@elysiajs/eden";

// get the type of follow requests from the API client
const request = client.api.users({ userid: "placeholder" }).followRequests.get;

type FollowRequest = Treaty.Data<typeof request>;
type SentRequest = FollowRequest["sent"][number];
type ReceivedRequest = FollowRequest["received"][number];

interface FollowRequestItemProps {
  request: SentRequest | ReceivedRequest;
  requestType: "sent" | "received";
}

export const FollowRequestItem = ({
  request,
  requestType,
}: FollowRequestItemProps) => {
  const { mutate: decide, isPending } = useDecideFollowRequest();

  return (
    <div className="flex items-center justify-between rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar
          name={request.requester.name}
          image={request.requester.image}
          size="md"
        />
        <div className="flex flex-col">
          <Link
            to="/users/$userid"
            params={{ userid: request.requester.id }}
            className="font-bold hover:underline"
          >
            {request.requester.displayUsername ||
              request.requester.username ||
              request.requester.name}
          </Link>
          <span className="text-base-content/60 text-xs">
            @{request.requester.username}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {request.status !== "pending" ? (
          <span className="badge badge-ghost capitalize">{request.status}</span>
        ) : (
          <>
            {requestType === "sent" && (
              <button
                type="button"
                className="btn btn-sm btn-outline btn-error"
                onClick={() =>
                  decide({
                    followRequestId: request.id,
                    decision: "cancelled",
                    userId: request.requester.id,
                  })
                }
                disabled={isPending}
              >
                Cancel
              </button>
            )}
            {requestType === "received" && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    decide({
                      followRequestId: request.id,
                      decision: "accepted",
                      userId: request.followerId,
                    })
                  }
                  disabled={isPending}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() =>
                    decide({
                      followRequestId: request.id,
                      decision: "rejected",
                      userId: request.followeeId,
                    })
                  }
                  disabled={isPending}
                >
                  Reject
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
