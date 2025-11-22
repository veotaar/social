import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { produce } from "immer";
import { client } from "@web/lib/api-client";
import type { PostFeedData } from "./useToggleLike";

async function removeBookmark({
  bookmarkId,
  userId,
}: { bookmarkId: string; userId: string }) {
  const { data, error } = await client
    .users({ userid: userId })
    .bookmarks({ bookmarkid: bookmarkId })
    .delete();

  if (error || !data) throw new Error("Failed to send comment");

  return data;
}

export function useRemoveBookmark(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["remove-bookmark"],
    mutationFn: removeBookmark,

    onMutate: async ({ bookmarkId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });

      const previousData = queryClient.getQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
      );

      // optimistically update infinite data
      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
        (old) => {
          if (!old) return old;

          return produce(old, (draft) => {
            for (const page of draft.pages) {
              for (const post of page.posts) {
                if (post.post.id === postId) {
                  post.post.isBookmarked = false;
                }
              }
            }
          });
        },
      );

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", "feed"], context.previousData);
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
    },
  });
}
