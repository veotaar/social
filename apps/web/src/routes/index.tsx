import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import PostFeed from "@web/components/post/PostFeed";
import PostWriter from "@web/components/post/PostWriter";
import { useSession } from "@web/lib/auth-client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="flex h-screen items-center justify-center p-2">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="h-screen p-2">
        <div>
          <p>You are not signed in.</p>
          <p>
            <Link to="/login" className="underline" preload="intent">
              Sign in
            </Link>{" "}
            to see posts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="m-auto h-full w-4xl p-2">
      <PostWriter />
      <PostFeed />
    </div>
  );
}
