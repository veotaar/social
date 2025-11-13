import type { Treaty } from "@elysiajs/eden";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
// import type { client } from "@web/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import Avatar from "../avatar/Avatar";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import Comment from "./Comment";
import { useState } from "react";
import { cn } from "@web/lib/utils";
import { useSendComment } from "@web/hooks/useSendComment";
import { Link } from "@tanstack/react-router";

export type PostData = Omit<
  Treaty.Data<typeof client.posts.get>,
  "pagination"
>["posts"][number];

const Post = ({ post: { post, author } }: { post: PostData }) => {
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const { mutate: sendComment, isPending: isSendingComment } = useSendComment();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["comments", post.id],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await client
        .posts({ postid: post.id })
        .comments.get({
          query: { cursor: pageParam },
        });
      if (error) throw error.status;

      return data;
    },
    initialPageParam: "initial",
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.pagination.hasMore;
      if (!hasMore) return undefined;
      return lastPage.pagination.nextCursor;
    },
    enabled: showComments,
  });

  const handleSendComment = () => {
    if (!commentContent.trim()) return;

    sendComment(
      { postId: post.id, content: commentContent },
      {
        onSuccess: () => {
          setCommentContent("");
          setShowCommentInput(false);
          setShowComments(true);
        },
      },
    );
  };

  if (!author) {
    return null;
  }

  return (
    <div>
      <div className="card group/post mt-4 mb-4 flex flex-col gap-2 rounded-md border border-base-300 bg-base-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={author.name} image={author.image} size="sm" />

          <div>
            <Link
              to="/profile/$userid"
              params={{ userid: author.id }}
              resetScroll={true}
            >
              <div className="flex items-center gap-2">
                <p className="font-bold">{author.displayUsername}</p>
                <p className="">@{author.username}</p>
              </div>
            </Link>

            <span
              className="lg:tooltip"
              data-tip={new Date(post.createdAt).toLocaleString()}
            >
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className={cn("ml-auto opacity-0 group-hover/post:opacity-100")}>
            <EllipsisVertical />
          </div>
        </div>

        <div className="whitespace-pre-wrap">{post.content}</div>

        <div className="flex items-center gap-1">
          <LikeButton
            likedByUser={post.likedByCurrentUser}
            likeCount={post.likesCount}
            postId={post.id}
          />
          <CommentButton
            postId={post.id}
            commentsCount={post.commentsCount}
            onClick={() => setShowCommentInput((prev) => !prev)}
          />
        </div>

        {showCommentInput && (
          <div className="mt-4 flex flex-col gap-2">
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Write a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleSendComment}
                disabled={isSendingComment || !commentContent.trim()}
              >
                {isSendingComment ? "Sending..." : "Send Comment"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentContent("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          className={cn("btn btn-ghost btn-sm mt-2", {
            hidden: post.commentsCount <= 0,
          })}
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </button>

        {showComments && (
          <div>
            {status === "pending" ? (
              <p>Loading comments...</p>
            ) : status === "error" ? (
              <p>Error loading comments: {error.message}</p>
            ) : (
              <div className="mt-2 flex flex-col">
                {data.pages.map((group) => (
                  <div
                    key={
                      group.pagination.hasMore
                        ? group.pagination.nextCursor
                        : "end"
                    }
                  >
                    {group.comments.map(({ comment, author }) => (
                      <Comment
                        key={comment.id}
                        comment={comment}
                        author={author}
                      />
                    ))}
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    className={cn("btn btn-ghost btn-block", {
                      hidden: !hasNextPage,
                    })}
                    disabled={!hasNextPage || isFetching}
                  >
                    {isFetchingNextPage
                      ? "Loading more..."
                      : hasNextPage
                        ? "Load More"
                        : "Loaded all comments"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;
