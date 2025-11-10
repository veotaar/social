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
    <div className="group flex w-min items-center">
      <button className="btn btn-circle" type="button" onClick={onClick}>
        <MessageCircle className={cn("group-hover:stroke-primary")} />
      </button>
      <p
        className={cn(
          "group-hover:text-primary",
        )}
      >
        {commentsCount}
      </p>
    </div>
  );
};

export default CommentButton;
