import type { Treaty } from "@elysiajs/eden";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import Avatar from "../avatar/Avatar";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import BookmarkButton from "./BookmarkButton";
import Comment from "./Comment";
import { DeletePostButton } from "./DeletePostButton";
import { useState, useRef } from "react";
import { cn } from "@web/lib/utils";
import { useSendComment } from "@web/components/post/useSendComment";
import { Link } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

export type PostData = Omit<
  Treaty.Data<typeof client.posts.get>,
  "pagination"
>["posts"][number];

const Post = ({ post: { post, author } }: { post: PostData }) => {
  const [showComments, setShowComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(
    null,
  );
  const [isUploadingCommentImage, setIsUploadingCommentImage] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const commentImageInputRef = useRef<HTMLInputElement>(null);
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

  const handleSendComment = async () => {
    if (!commentContent.trim() && !commentImage) return;

    let imageUrl: string | undefined;

    // upload comment image if one is selected
    if (commentImage) {
      setIsUploadingCommentImage(true);
      try {
        const { data, error } = await client.upload.image.post({
          type: "comment",
          file: commentImage,
        });

        if (error || !data) {
          throw new Error("Failed to upload image");
        }

        imageUrl = data.url;
      } finally {
        setIsUploadingCommentImage(false);
      }
    }

    sendComment(
      { postId: post.id, content: commentContent, imageUrl },
      {
        onSuccess: () => {
          setCommentContent("");
          setCommentImage(null);
          setCommentImagePreview(null);
          setShowCommentInput(false);
          setShowComments(true);
        },
      },
    );
  };

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImage(file);
      setCommentImagePreview(URL.createObjectURL(file));
    }
    if (commentImageInputRef.current) {
      commentImageInputRef.current.value = "";
    }
  };

  const removeCommentImage = () => {
    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }
    setCommentImage(null);
    setCommentImagePreview(null);
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
              to="/users/$userid"
              params={{ userid: author.id }}
              resetScroll={true}
            >
              <div className="flex items-center gap-2">
                <p className="font-bold">{author.displayUsername}</p>
                <p className="">@{author.username}</p>
              </div>
            </Link>

            <Link
              to="/posts/$postid"
              params={{ postid: post.id }}
              resetScroll={true}
            >
              <span
                className="lg:tooltip"
                data-tip={new Date(post.createdAt).toLocaleString()}
              >
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </Link>
          </div>

          <div
            className={cn(
              "ml-auto self-start opacity-30 group-hover/post:opacity-100",
            )}
          >
            <DeletePostButton post={{ post, author }} />
          </div>
        </div>

        <div className="whitespace-pre-wrap">{post.content}</div>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div
            className={cn(
              "mt-2 grid gap-2",
              post.images.length === 1 && "grid-cols-1",
              post.images.length === 2 && "grid-cols-2",
              post.images.length >= 3 && "grid-cols-2",
            )}
          >
            {post.images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
                className="cursor-pointer"
              >
                <img
                  src={image.imageUrl}
                  alt={image.altText || `Post image ${index + 1}`}
                  className={cn(
                    "w-full rounded-lg object-cover",
                    post.images.length === 1 && "max-h-96",
                    post.images.length >= 2 && "h-48",
                    post.images.length === 3 &&
                      index === 0 &&
                      "col-span-2 h-48",
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* Post Image Lightbox */}
        {post.images && post.images.length > 0 && (
          <ImageLightbox
            images={post.images.map((img) => ({
              url: img.imageUrl,
              alt: img.altText || undefined,
            }))}
            currentIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            onNext={() =>
              setLightboxIndex((prev) => (prev + 1) % post.images.length)
            }
            onPrevious={() =>
              setLightboxIndex(
                (prev) => (prev - 1 + post.images.length) % post.images.length,
              )
            }
          />
        )}

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
          <BookmarkButton isBookmarked={post.isBookmarked} postId={post.id} />
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

            {/* Comment Image Preview */}
            {commentImagePreview && (
              <div className="relative inline-block">
                <img
                  src={commentImagePreview}
                  alt="Comment preview"
                  className="h-24 w-auto rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={removeCommentImage}
                  className="btn btn-circle btn-error btn-xs absolute top-1 right-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Image Upload Button */}
              <input
                ref={commentImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleCommentImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => commentImageInputRef.current?.click()}
                disabled={!!commentImage}
                className={cn(
                  "btn btn-ghost btn-sm",
                  commentImage && "btn-disabled",
                )}
                title={
                  commentImage ? "Remove current image first" : "Add image"
                }
              >
                <ImagePlus className="h-4 w-4" />
              </button>

              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleSendComment}
                disabled={
                  isSendingComment ||
                  isUploadingCommentImage ||
                  (!commentContent.trim() && !commentImage)
                }
              >
                {isUploadingCommentImage
                  ? "Uploading..."
                  : isSendingComment
                    ? "Sending..."
                    : "Send Comment"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentContent("");
                  removeCommentImage();
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
