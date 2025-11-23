import { createFileRoute, redirect } from "@tanstack/react-router";
import FollowingFeed from "@web/components/post/FollowingFeed";
import PostWriter from "@web/components/post/PostWriter";

export const Route = createFileRoute("/following")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/following" },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="m-auto mt-12 h-full max-w-3xl p-2">
      <h1 className="mb-6 font-bold text-xl">Following Feed</h1>
      <p>Posts from users you follow.</p>
      <FollowingFeed />
    </div>
  );
}
