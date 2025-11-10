import { formatDistanceToNow } from "date-fns";
import Avatar from "../avatar/Avatar";

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
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
    <div className="mb-4 border-b pb-2">
      <div className="flex items-center gap-2">
        <Avatar
          name={author ? author.name : ""}
          image={author ? author.image : null}
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
    </div>
  );
};

export default Comment;
