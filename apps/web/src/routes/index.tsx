import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@web/lib/auth-client";
import { Link } from "@tanstack/react-router";
import PostWriter from "@web/components/PostWriter";
import PostFeed from "@web/components/PostFeed";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="p-2 h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="p-2 h-screen">
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
    <div className="p-2 w-4xl m-auto h-full">
      <div>
        <p>Signed in as {session.data.user.name}</p>
        <p>
          email verified:{" "}
          <span className="text-green-600">
            {session.data.user.emailVerified ? "true" : "false"}
          </span>
        </p>
      </div>
      <PostWriter />
      <PostFeed />
    </div>
  );
}
