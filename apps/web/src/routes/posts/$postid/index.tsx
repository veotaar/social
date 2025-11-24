import {
  createFileRoute,
  redirect,
  notFound,
  Link,
} from "@tanstack/react-router";
import Post from "@web/components/post/Post";
import { client } from "@web/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/posts/$postid/")({
  beforeLoad: async ({ context: { auth }, params: { postid } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: `/posts/${postid}` },
      });
    }
  },
  loader: async ({ context: { queryClient }, params: { postid } }) => {
    return await queryClient.ensureQueryData({
      queryKey: ["post", postid],
      queryFn: async () => {
        const { data, error } = await client.posts({ postid }).get();
        if (error) throw notFound();

        return data;
      },
    });
  },
  notFoundComponent: () => {
    return (
      <div className="m-auto mt-12 h-full max-w-3xl p-2">
        <p>Post not found</p>
        <Link to="/" className="link">
          Go back to feed
        </Link>
      </div>
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { postid } = Route.useParams();

  const {
    data: postData,
    isLoading,
    isError,
  } = useQuery({
    staleTime: 0,
    queryKey: ["post", postid],
    queryFn: async () => {
      const { data, error } = await client.posts({ postid }).get();
      if (error) throw error.status;

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="m-auto mt-12 h-full max-w-3xl p-2">
        <p>loading...</p>
      </div>
    );
  }

  if (isError || !postData) {
    return (
      <div className="m-auto mt-12 h-full max-w-3xl p-2">
        <p>failed to load post</p>
      </div>
    );
  }

  return (
    <div className="m-auto mt-12 h-full max-w-3xl p-2">
      <Post post={postData} />
    </div>
  );
}
