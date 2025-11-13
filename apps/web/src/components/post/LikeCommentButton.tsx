import { cn } from "@web/lib/utils";
import { Heart } from "lucide-react";
import { useToggleCommentLike } from "@web/hooks/useToggleCommentLike";

interface LikeCommentButtonProps {
  likedByUser: boolean;
  postId: string;
  commentId: string;
  likeCount: number;
}

const LikeCommentButton = ({
  postId,
  commentId,
  likeCount,
  likedByUser,
}: LikeCommentButtonProps) => {
  const toggleLike = useToggleCommentLike();

  return (
    <div className="group flex w-min items-center">
      <button
        className="btn btn-circle"
        type="button"
        onClick={() =>
          toggleLike.mutate({ postId, commentId, like: !likedByUser })
        }
      >
        <Heart
          className={cn("group-hover:stroke-primary", {
            "fill-primary stroke-primary": likedByUser,
          })}
        />
      </button>
      <p
        className={cn(
          { "text-primary": likedByUser },
          "group-hover:text-primary",
        )}
      >
        {likeCount}
      </p>
    </div>
  );
};

export default LikeCommentButton;
