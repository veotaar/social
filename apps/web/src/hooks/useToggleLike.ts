import type { Treaty } from "@elysiajs/eden";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { PostData } from "@web/components/post/Post";
import { client } from "@web/lib/api-client";

type PostFeedData = Treaty.Data<typeof client.posts.get>;

async function toggleLike({
  postId,
  like,
}: { postId: string; like: boolean }): Promise<PostData> {
  let responseData: PostData | null = null;

  if (like) {
    const { data } = await client.posts({ postid: postId }).likes.post();
    responseData = data;
  } else {
    const { data } = await client.posts({ postid: postId }).likes.delete();
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

      const previousData = queryClient.getQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
      );

      // optimistically update infinite data
      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.post.id === postId
                  ? {
                      ...post,
                      post: {
                        ...post.post,
                        likesCount: like
                          ? post.post.likesCount + 1
                          : post.post.likesCount - 1,
                        likedByCurrentUser: like,
                      },
                    }
                  : post,
              ),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // roll back optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(["posts", "feed"], context.previousData);
      }
    },
    onSuccess: (updated) => {
      // actual response update
      queryClient.setQueryData<InfiniteData<PostFeedData>>(
        ["posts", "feed"],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((post) =>
                post.post.id === updated.post.id
                  ? {
                      ...post,
                      post: {
                        ...post.post,
                        likesCount: updated.post.likesCount,
                        likedByCurrentUser: updated.post.likedByCurrentUser,
                      },
                    }
                  : post,
              ),
            })),
          };
        },
      );
    },
  });
}
