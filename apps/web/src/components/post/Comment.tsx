import { formatDistanceToNow } from "date-fns";
import Avatar from "../avatar/Avatar";
import LikeCommentButton from "./LikeCommentButton";
import { Link } from "@tanstack/react-router";

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    postId: string;
    likesCount: number;
    likedByCurrentUser: boolean;
  };
  author: {
    id: string;
    username: string | null;
    displayUsername: string | null;
    name: string;
    image: string | null;
  } | null;
}

const Comment = ({ comment, author }: CommentProps) => {
  if (!author) {
    return null;
  }

  return (
    <div className="mb-2 flex gap-2 rounded-md border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="grow-0">
        <Avatar name={author.name} image={author.image} size="xs" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Link to="/profile/$userid" params={{ userid: author.id }}>
            <div className="group/comment-author flex gap-2">
              <p className="group-hover/comment-author:text-primary">
                {author.displayUsername}
              </p>
              <p className="font-bold group-hover/comment-author:text-primary">
                @{author?.username}
              </p>
            </div>
          </Link>

          <p
            className="lg:tooltip text-base-content/70"
            data-tip={new Date(comment.createdAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div className="my-1 whitespace-pre-wrap">{comment.content}</div>
        <div>
          <LikeCommentButton
            postId={comment.postId}
            commentId={comment.id}
            likedByUser={comment.likedByCurrentUser}
            likeCount={comment.likesCount}
          />
        </div>
      </div>
    </div>
  );
};

export default Comment;
