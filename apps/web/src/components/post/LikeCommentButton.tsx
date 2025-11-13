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
    <div className="group flex w-min items-center justify-start">
      <button
        className="btn btn-circle btn-ghost btn-sm hover:border-0 hover:bg-primary/10"
        type="button"
        onClick={() =>
          toggleLike.mutate({ postId, commentId, like: !likedByUser })
        }
      >
        <Heart
          size={18}
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
