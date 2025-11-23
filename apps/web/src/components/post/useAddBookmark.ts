import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { produce } from "immer";
import { client } from "@web/lib/api-client";
import type { PostFeedData } from "./useToggleLike";

async function addBookmark({
  postId,
  userId,
}: { postId: string; userId: string }) {
  const { data, error } = await client
    .users({ userid: userId })
    .bookmarks.post({ postid: postId });

  if (error || !data) throw new Error("Failed to add bookmark");

  return data;
}

export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["add-bookmark"],
    mutationFn: addBookmark,

    onMutate: async ({ postId }) => {
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
        (old) => {
          if (!old) return old;

          return produce(old, (draft) => {
            for (const page of draft.pages) {
              for (const post of page.posts) {
                if (post.post.id === postId) {
                  post.post.isBookmarked = true;
                }
              }
            }
          });
        },
      );

      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "following"],
        (old) => {
          if (!old) return old;

          return produce(old, (draft) => {
            for (const page of draft.pages) {
              for (const post of page.posts) {
                if (post.post.id === postId) {
                  post.post.isBookmarked = true;
                }
              }
            }
          });
        },
      );

      return { previousData, previousFollowingData };
    },

    onError: (_err, _variables, context) => {
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
      queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });
      queryClient.invalidateQueries({ queryKey: ["post", updated.post.id] });
      queryClient.invalidateQueries({
        queryKey: ["userPosts", updated.author?.id],
      });

      // queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      // queryClient.invalidateQueries({ queryKey: ["posts", "following"] });

      // actual response update
      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
        (old) => {
          if (!old) return old;

          return produce(old, (draft) => {
            for (const page of draft.pages) {
              for (const post of page.posts) {
                if (post.post.id === updated.post.id) {
                  post.post.isBookmarked = updated.post.isBookmarked;
                }
              }
            }
          });
        },
      );

      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "following"],
        (old) => {
          if (!old) return old;

          return produce(old, (draft) => {
            for (const page of draft.pages) {
              for (const post of page.posts) {
                if (post.post.id === updated.post.id) {
                  post.post.isBookmarked = updated.post.isBookmarked;
                }
              }
            }
          });
        },
      );
    },
  });
}
