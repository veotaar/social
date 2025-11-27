import { formatDistanceToNow } from "date-fns";
import Avatar from "../avatar/Avatar";
import LikeCommentButton from "./LikeCommentButton";
import { Link } from "@tanstack/react-router";
import { client } from "@web/lib/api-client";
import type { Treaty } from "@elysiajs/eden";
import { DeleteCommentButton } from "./DeleteCommentButton";
import { cn } from "@web/lib/utils";

const commentRequest = client.posts({ postid: "" }).comments.get;

export type CommentData = Omit<
  Treaty.Data<typeof commentRequest>,
  "pagination"
>["comments"][number];

const Comment = ({ comment, author }: CommentData) => {
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
          <div className="flex items-center gap-2">
            <Link to="/users/$userid" params={{ userid: author.id }}>
              <div className="group/comment-author flex gap-2">
                <p className="group-hover/comment-author:text-primary">
                  {author.displayUsername}
                </p>
                <p className="font-bold group-hover/comment-author:text-primary">
                  @{author?.username}
                </p>
              </div>
            </Link>
          </div>

          <p
            className="lg:tooltip text-base-content/70"
            data-tip={new Date(comment.createdAt).toLocaleString()}
          >
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </p>

          <div
            className={cn(
              "ml-auto self-start opacity-30 group-hover/post:opacity-100",
            )}
          >
            <DeleteCommentButton comment={{ comment, author }} />
          </div>
        </div>
        <div className="my-1 whitespace-pre-wrap">{comment.content}</div>

        {/* Comment Image */}
        {comment.imageUrl && (
          <div className="my-2">
            <img
              src={comment.imageUrl}
              alt="Comment attachment"
              className="max-h-48 w-auto rounded-lg object-cover"
            />
          </div>
        )}

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
