import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { produce } from "immer";

type CommentInfiniteData =
  | InfiniteData<
      {
        comments: {
          comment: {
            postId: string;
            id: string;
            content: string;
            imageUrl: string | null;
            createdAt: string;
            likesCount: number | null;
            repliesCount: number | null;
            parentCommentId: string | null;
            likedByCurrentUser: boolean;
          };
          author: {
            id: string;
            username: string | null;
            displayUsername: string | null;
            image: string | null;
            name: string;
          } | null;
        }[];
        pagination: {
          hasMore: boolean;
          nextCursor: string | null;
        };
      },
      unknown
    >
  | undefined;

export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["toggleCommentLike"],
    mutationFn: async ({
      postId,
      commentId,
      like,
    }: { postId: string; commentId: string; like: boolean }) => {
      if (like) {
        const { data } = await client
          .posts({ postid: postId })
          .comments({ commentid: commentId })
          .likes.post();
        if (!data) throw new Error("Failed to like comment");
        return data;
      }

      const { data } = await client
        .posts({ postid: postId })
        .comments({ commentid: commentId })
        .likes.delete();
      if (!data) throw new Error("Failed to unlike comment");
      return data;
    },
    onMutate: async ({ postId, commentId, like }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      const previousData = queryClient.getQueryData<CommentInfiniteData>([
        "comments",
        postId,
      ]);

      // optimistically update infinite data
      queryClient.setQueryData<CommentInfiniteData>(
        ["comments", postId],
        produce((draft) => {
          if (!draft) return;

          draft.pages.forEach((page) => {
            page.comments.forEach((comment) => {
              if (comment.comment.id === commentId) {
                comment.comment.likesCount = like
                  ? (comment.comment.likesCount ?? 0) + 1
                  : (comment.comment.likesCount ?? 1) - 1;
                comment.comment.likedByCurrentUser = like;
              }
            });
          });
        }),
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // roll back optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          ["comments", variables.postId],
          context.previousData,
        );
      }
    },
    onSuccess: (updated, variables) => {
      // actual response update
      queryClient.setQueryData<CommentInfiniteData>(
        ["comments", variables.postId],
        produce((draft) => {
          if (!draft) return;

          draft.pages.forEach((page) => {
            page.comments.forEach((comment) => {
              if (comment.comment.id === updated.id) {
                comment.comment.likesCount = updated.likesCount;
              }
            });
          });
        }),
      );
    },
  });
}
