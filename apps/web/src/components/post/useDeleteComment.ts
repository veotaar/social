import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

const deleteComment = async ({
  postId,
  commentId,
  asAdmin,
}: { postId: string; commentId: string; asAdmin?: boolean }) => {
  if (asAdmin) {
    const { data, error } = await client.admin
      .posts({ postId })
      .comments({ commentId })
      .delete();

    if (error || !data) {
      throw new Error("Failed to delete post as admin");
    }

    return data;
  }

  const { data, error } = await client
    .posts({ postid: postId })
    .comments({ commentid: commentId })
    .delete();

  if (error || !data) {
    throw new Error("Failed to delete post");
  }

  return data;
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["delete-comment"],
    mutationFn: deleteComment,
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ["user", deleted.authorId] });
      queryClient.invalidateQueries({
        queryKey: ["userPosts", deleted.authorId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["comments", deleted.postId] });
    },
  });
};
