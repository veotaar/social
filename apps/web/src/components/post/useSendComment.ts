import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";

async function sendComment({
  postId,
  content,
  parentCommentId,
}: { postId: string; content: string; parentCommentId?: string }) {
  const { data, error } = await client
    .posts({ postid: postId })
    .comments.post({ content, parentCommentId });

  if (error) throw new Error("Failed to send comment");

  return data;
}

export function useSendComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["add-comment"],
    mutationFn: sendComment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data?.postId],
      });
    },
  });
}
