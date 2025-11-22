import { useToggleLike } from "@web/components/post/useToggleLike";
import { cn } from "@web/lib/utils";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  likedByUser: boolean;
  postId: string;
  likeCount: number;
}

const LikeButton = ({ postId, likeCount, likedByUser }: LikeButtonProps) => {
  const toggleLike = useToggleLike();

  return (
    <div className="group/like-button flex w-min items-center">
      <button
        className="btn btn-circle btn-ghost hover:border-0 hover:bg-primary/10"
        type="button"
        onClick={() => toggleLike.mutate({ postId, like: !likedByUser })}
      >
        <Heart
          className={cn("group-hover/like-button:stroke-primary", {
            "fill-primary stroke-primary": likedByUser,
          })}
        />
      </button>
      <p
        className={cn(
          { "text-primary": likedByUser },
          "group-hover/like-button:text-primary",
        )}
      >
        {likeCount}
      </p>
    </div>
  );
};

export default LikeButton;
