import { useGetFollowRequests } from "@web/hooks/useGetFollowRequests";
import { useSendFollowRequest } from "@web/hooks/useSendFollowRequest";
import { useDecideFollowRequest } from "@web/hooks/useDecideFollowRequest";

interface FollowButtonProps {
  userId: string; // The ID of the user to follow/unfollow
  isFollowing: boolean;
  isFollowedBy: boolean;
}

const FollowButton = ({
  isFollowing,
  isFollowedBy,
  userId,
}: FollowButtonProps) => {
  const { data: followRequests } = useGetFollowRequests();

  const decideFollowRequest = useDecideFollowRequest();
  const sendFollowRequest = useSendFollowRequest();

  if (!followRequests) return null;

  const { sent } = followRequests;

  const sentRequest = sent.find((req) => req.followeeId === userId);

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

  if (isFollowedBy && !isFollowing) {
    return (
      <button
        type="button"
        onClick={() => sendFollowRequest.mutate(userId)}
        className="btn btn-primary"
      >
        Follow Back
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => sendFollowRequest.mutate(userId)}
      className="btn btn-primary"
    >
      Follow
    </button>
  );
};

export default FollowButton;
