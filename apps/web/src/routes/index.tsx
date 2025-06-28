import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const session = useSession();

  return (
    <div className="p-2">
      {session.data && (
        <div>
          <p>Signed in as {session.data.user.name}</p>
          <p>email verified: {session.data.user.emailVerified}</p>
        </div>
      )}
      {!session.data && (
        <div>
          <p>You are not signed in.</p>
          <p>
            <Link to="/login" className="underline" preload="intent">
              Sign in
            </Link>{" "}
            to see posts
          </p>
        </div>
      )}
    </div>
  );
}
