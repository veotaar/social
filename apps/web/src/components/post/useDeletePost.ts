import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

const deletePost = async ({
  postId,
  asAdmin,
}: { postId: string; asAdmin?: boolean }) => {
  if (asAdmin) {
    const { data, error } = await client.api.admin.posts({ postId }).delete();

    if (error || !data) {
      throw new Error("Failed to delete post as admin");
    }

    return data;
  }

  const { data, error } = await client.api.posts({ postid: postId }).delete();

  if (error || !data) {
    throw new Error("Failed to delete post");
  }

  return data;
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["delete-post"],
    mutationFn: deletePost,
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ["user", deleted.authorId] });
      queryClient.invalidateQueries({
        queryKey: ["userPosts", deleted.authorId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
};
