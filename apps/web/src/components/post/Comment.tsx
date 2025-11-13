import { formatDistanceToNow } from "date-fns";
import Avatar from "../avatar/Avatar";
import LikeCommentButton from "./LikeCommentButton";

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
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Avatar
          name={author ? author.name : ""}
          image={author ? author.image : null}
          size="sm"
        />
        <span className="font-bold">@{author?.username}</span>
        <span
          className="lg:tooltip"
          data-tip={new Date(comment.createdAt).toLocaleString()}
        >
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
      <div className="mt-2 whitespace-pre-wrap">{comment.content}</div>
      <div>
        <LikeCommentButton
          postId={comment.postId}
          commentId={comment.id}
          likedByUser={comment.likedByCurrentUser}
          likeCount={comment.likesCount}
        />
      </div>
    </div>
  );
};

export default Comment;
