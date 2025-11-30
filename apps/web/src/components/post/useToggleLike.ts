import type { Treaty } from "@elysiajs/eden";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { PostData } from "@web/components/post/Post";
import { client } from "@web/lib/api-client";
import { produce } from "immer";

export type PostFeedData = Treaty.Data<typeof client.api.posts.get>;

async function toggleLike({
  postId,
  like,
}: { postId: string; like: boolean }): Promise<PostData> {
  let responseData: PostData | null = null;

  if (like) {
    const { data } = await client.api.posts({ postid: postId }).likes.post();
    responseData = data;
  } else {
    const { data } = await client.api.posts({ postid: postId }).likes.delete();
    responseData = data;
  }

  if (!responseData) throw new Error("Failed to toggle like");

  return responseData;
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["toggle-like"],
    mutationFn: toggleLike,
    onMutate: async ({ postId, like }) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });
      await queryClient.cancelQueries({ queryKey: ["posts", "following"] });

      const previousData = queryClient.getQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
      );

      const previousFollowingData = queryClient.getQueryData<
        InfiniteData<PostFeedData>
      >(["posts", "following"]);

      // optimistically update infinite data
      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
        produce((draft) => {
          if (!draft) return;

          draft.pages.forEach((page) => {
            page.posts.forEach((post) => {
              if (post.post.id === postId) {
                post.post.likesCount += like ? 1 : -1;
                post.post.likedByCurrentUser = like;
              }
            });
          });
        }),
      );

      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "following"],
        produce((draft) => {
          if (!draft) return;

          draft.pages.forEach((page) => {
            page.posts.forEach((post) => {
              if (post.post.id === postId) {
                post.post.likesCount += like ? 1 : -1;
                post.post.likedByCurrentUser = like;
              }
            });
          });
        }),
      );

      return { previousData, previousFollowingData };
    },
    onError: (err, variables, context) => {
      // roll back optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(["posts", "feed"], context.previousData);
      }

      if (context?.previousFollowingData) {
        queryClient.setQueryData(
          ["posts", "following"],
          context.previousFollowingData,
        );
      }
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["post", updated.post.id] });
      queryClient.invalidateQueries({
        queryKey: ["userPosts", updated.author?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      // queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      // queryClient.invalidateQueries({ queryKey: ["posts", "following"] });

      // actual response update
      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
        produce((draft) => {
          if (!draft) return;

          draft.pages.forEach((page) => {
            page.posts.forEach((post) => {
              if (post.post.id === updated.post.id) {
                post.post.likesCount = updated.post.likesCount;
                post.post.likedByCurrentUser = updated.post.likedByCurrentUser;
              }
            });
          });
        }),
      );

      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "following"],
        produce((draft) => {
          if (!draft) return;

          draft.pages.forEach((page) => {
            page.posts.forEach((post) => {
              if (post.post.id === updated.post.id) {
                post.post.likesCount = updated.post.likesCount;
                post.post.likedByCurrentUser = updated.post.likedByCurrentUser;
              }
            });
          });
        }),
      );
    },
  });
}
