import { cn } from "@web/lib/utils";
import { MessageCircle } from "lucide-react";

interface CommentButtonProps {
  commentsCount: number;
  postId: string;
  onClick?: () => void;
}

const CommentButton = ({
  postId,
  commentsCount,
  onClick,
}: CommentButtonProps) => {
  return (
    <div className="group/comment-button flex w-min items-center opacity-40">
      <button
        className="btn btn-circle btn-ghost hover:border-0 hover:bg-primary/10"
        type="button"
        title="write comment"
        onClick={onClick}
      >
        <MessageCircle
          className={cn("group-hover/comment-button:stroke-primary")}
        />
      </button>
      <p className={cn("group-hover/comment-button:text-primary")}>
        {commentsCount}
      </p>
    </div>
  );
};

export default CommentButton;
