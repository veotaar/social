import type { Treaty } from "@elysiajs/eden";
import { useQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
// import type { client } from "@web/lib/api-client";
import { formatDistanceToNow } from "date-fns";

type PostData = Omit<
  Treaty.Data<typeof client.posts.get>,
  "pagination"
>["posts"][number];

const Post = ({ post }: { post: PostData }) => {
  const { data, error } = useQuery({
    queryKey: ["comments", post.post.id],
    queryFn: async () => {
      const { data, error } = await client
        .posts({ postid: post.post.id })
        .comments.get();

      if (error) throw error.status;

      return data.comments;
    },
    enabled: post.post.commentsCount > 0,
  });

  return (
    <div className="border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-2 text-sm text-gray-500">
        Posted by {post.author?.name} on{" "}
        {formatDistanceToNow(new Date(post.post.createdAt), {
          addSuffix: true,
        })}
        {`${post.post.createdAt}`}
      </div>
      <div className="whitespace-pre-wrap">{post.post.content}</div>
      <div className="mt-2 flex space-x-4 text-sm text-gray-600">
        <div>Likes: {post.post.likesCount}</div>
        <div>Comments: {post.post.commentsCount}</div>
        <div>Shares: {post.post.sharesCount}</div>
      </div>
      {data && data.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Comments:</h4>
          <ul>
            {data.map((comment) => (
              <li key={comment.comment.id} className="mb-2">
                <div className="text-sm font-medium">
                  {comment.author?.name}{" "}
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(comment.comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="whitespace-pre-wrap">
                  {comment.comment.content}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Post;
