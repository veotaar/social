import { useToggleLike } from "@web/hooks/useToggleLike";
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
    <div className="group flex w-min items-center">
      <button
        className="btn btn-circle"
        type="button"
        onClick={() => toggleLike.mutate({ postId, like: !likedByUser })}
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

export default LikeButton;
