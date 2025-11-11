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
    <>
      <div className="card mb-4 flex flex-col gap-2 rounded-md border p-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={author ? author.name : ""}
            image={author ? author.image : null}
            size="md"
          />

          <div>
            <Link
              to="/profile/$userid"
              params={{ userid: author.id }}
              resetScroll={true}
            >
              <p className="">@{author?.username}</p>
            </Link>

            <span className="font-bold">{author?.name} &middot; </span>
            <span
              className="lg:tooltip"
              data-tip={new Date(post.createdAt).toLocaleString()}
            >
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="ml-auto">
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
          className={cn("btn btn-sm mt-2", {
            hidden: post.commentsCount <= 0,
          })}
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
        >
          {showComments ? "Hide Comments" : "Show Comments"}
        </button>

        {showComments && (
          <div className="mt-4">
            {status === "pending" ? (
              <p>Loading comments...</p>
            ) : status === "error" ? (
              <p>Error loading comments: {error.message}</p>
            ) : (
              <div>
                <div>
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={!hasNextPage || isFetching}
                  >
                    {isFetchingNextPage
                      ? "Loading more..."
                      : hasNextPage
                        ? "Load More"
                        : "Nothing more to load"}
                  </button>
                </div>
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
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Post;
