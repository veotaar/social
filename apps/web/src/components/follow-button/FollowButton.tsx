import { useGetFollowRequests } from "@web/hooks/useGetFollowRequests";
import { useSendFollowRequest } from "@web/hooks/useSendFollowRequest";
import { useDecideFollowRequest } from "@web/hooks/useDecideFollowRequest";
import { useUnfollow } from "./useUnfollow";
import { useRemoveFollower } from "./useRemoveFollower";
import { useMutualUnfollow } from "./useMutualUnfollow";
import { useSession } from "@web/lib/auth-client";
import { ChevronDown } from "lucide-react";
import { cn } from "@web/lib/utils";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean; // Whether the current user is following this user
  isFollowedBy: boolean; // Whether this user is following the current user
  isBlocked: boolean;
}

const FollowButton = ({
  isFollowing,
  isFollowedBy,
  isBlocked,
  userId,
}: FollowButtonProps) => {
  const { data: followRequests } = useGetFollowRequests();

  const { data: currentUserData } = useSession();

  const decideFollowRequest = useDecideFollowRequest();
  const sendFollowRequest = useSendFollowRequest();
  const unfollow = useUnfollow();
  const removeFollower = useRemoveFollower();
  const mutualUnfollow = useMutualUnfollow();

  if (!followRequests) return null;
  if (!currentUserData) return null;

  const {
    user: { id: currentUserId },
  } = currentUserData;

  const { sent } = followRequests;

  const sentRequest = sent.find((req) => req.followeeId === userId);

  if (isBlocked) {
    return (
      <button type="button" className="btn btn-disabled" disabled>
        User Blocked
      </button>
    );
  }

  if (sentRequest) {
    return (
      <button
        type="button"
        onClick={() =>
          decideFollowRequest.mutate({
            followRequestId: sentRequest.id,
            decision: "cancelled",
            userId,
          })
        }
        className="btn btn-error"
      >
        Cancel Request
      </button>
    );
  }

  const showDropdown = isFollowing || isFollowedBy;

  if (!showDropdown) {
    return (
      <button
        type="button"
        onClick={() => sendFollowRequest.mutate(userId)}
        className="btn btn-primary"
      >
        Follow
      </button>
    );
  }

  return (
    <div className="join">
      <button
        type="button"
        className={cn("btn join-item", {
          "btn-neutral": isFollowing,
          "btn-primary": !isFollowing,
        })}
        onClick={
          isFollowing ? undefined : () => sendFollowRequest.mutate(userId)
        }
      >
        {isFollowing ? (isFollowedBy ? "Friends" : "Following") : "Follow Back"}
      </button>
      <div className="dropdown dropdown-end join-item">
        <button
          tabIndex={0}
          type="button"
          className={cn("btn join-item", {
            "btn-neutral": isFollowing,
            "btn-primary": !isFollowing,
          })}
        >
          <ChevronDown size={16} />
        </button>
        <ul
          // biome-ignore lint/a11y/noNoninteractiveTabindex: daisyUI needs it
          tabIndex={0}
          className="menu dropdown-content z-1 w-52 rounded-box bg-base-100 p-2 shadow"
        >
          {isFollowing && (
            <li>
              <button
                type="button"
                onClick={() =>
                  unfollow.mutate({ currentUserId, targetUserId: userId })
                }
              >
                Unfollow
              </button>
            </li>
          )}
          {isFollowedBy && (
            <li>
              <button
                type="button"
                onClick={() =>
                  removeFollower.mutate({ currentUserId, targetUserId: userId })
                }
              >
                Remove Follower
              </button>
            </li>
          )}
          {isFollowing && isFollowedBy && (
            <li>
              <button
                type="button"
                onClick={() =>
                  mutualUnfollow.mutate({ currentUserId, targetUserId: userId })
                }
              >
                Unfollow Each Other
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FollowButton;
