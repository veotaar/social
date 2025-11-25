import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import PostFeed from "@web/components/post/PostFeed";
import PostWriter from "@web/components/post/PostWriter";
import { useSession } from "@web/lib/auth-client";
import GuestLoginButton from "@web/components/guest-login-button/GuestLogin";
import { useGetSystemSettings } from "@web/hooks/useGetSystemSettings";
import { TriangleAlert, Info } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const session = useSession();

  const { data: systemData } = useGetSystemSettings();

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
    if (systemData?.maintenanceMode) {
      return (
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="font-bold text-5xl">Maintenance Mode</h1>
              <div className="alert alert-warning mt-6 rounded-md">
                <TriangleAlert className="h-6 w-6 shrink-0" />
                <span>
                  The site is currently under maintenance. Please check back
                  later.
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
              {systemData?.allowSignup && (
                <Link to="/register" className="btn btn-ghost" preload="intent">
                  Create Account
                </Link>
              )}
              {systemData?.allowGuestLogin && (
                <>
                  <div className="divider">OR</div>
                  <GuestLoginButton />
                </>
              )}
            </div>
            {!systemData?.allowSignup && !systemData?.allowGuestLogin && (
              <div className="alert alert-info mt-6 rounded-md">
                <Info className="h-6 w-6 shrink-0" />
                <span>New registrations are currently closed.</span>
              </div>
            )}
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
