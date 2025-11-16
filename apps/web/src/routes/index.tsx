import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import PostFeed from "@web/components/post/PostFeed";
import PostWriter from "@web/components/post/PostWriter";
import { useSession } from "@web/lib/auth-client";
import GuestLoginButton from "@web/components/guest-login-button/GuestLogin";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const session = useSession();

  if (session.isPending) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <span className="loading loading-spinner loading-lg text-primary" />
            <h2 className="mt-6 font-semibold text-2xl">Loading</h2>
            <p className="mt-2 text-base-content/70">
              Please wait while we prepare your feed...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="font-bold text-5xl">Welcome!</h1>
            <p className="py-6 text-lg">
              Sign in to connect with friends, share moments, and discover
              what's happening.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/login" className="btn btn-primary" preload="intent">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-ghost" preload="intent">
                Create Account
              </Link>
              <GuestLoginButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-auto mt-12 h-full max-w-3xl p-2">
      <PostWriter />
      <PostFeed />
    </div>
  );
}
