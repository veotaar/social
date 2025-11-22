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
                  post.post.isBookmarked = true;
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
