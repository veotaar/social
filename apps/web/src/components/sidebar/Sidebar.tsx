import { Link, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Bell,
  Bookmark,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
} from "lucide-react";
import ThemeController from "@web/components/theme-controller/ThemeController";
import { useSession, signOut } from "@web/lib/auth-client";
import { Activity, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Avatar from "@web/components/avatar/Avatar";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { cn } from "@web/lib/utils";

export function Sidebar() {
  const session = useSession();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      navigate({ to: "/login" });
    },
  });

  const closeMenu = () => setIsOpen(false);

  const { data, isSuccess } = useInfiniteQuery({
    staleTime: 0,
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await client
        // biome-ignore lint/style/noNonNullAssertion: component only renders when user is authenticated
        .users({ userid: session.data!.user.id })
        .notifications.get({
          query: { cursor: pageParam },
        });
      if (error) throw error.status;

      return data;
    },
    initialPageParam: "initial",
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.pagination.hasMore;
      if (!hasMore) return undefined;
      return lastPage.pagination.nextCursor;
    },
  });

  if (!session.data) {
    return null;
  }

  return (
    <Activity mode={session.data ? "visible" : "hidden"}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-square fixed top-4 left-4 z-50 2xl:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 2xl:hidden"
          onClick={closeMenu}
          onKeyDown={(e) => e.key === "Escape" && closeMenu()}
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-base-300 bg-base-100 p-4 transition-transform duration-300 ease-in-out 2xl:translate-x-0 2xl:border-r",
          {
            "translate-x-0": isOpen,
            "-translate-x-full": !isOpen,
          },
        )}
      >
        <div className="flex h-full flex-col justify-between pt-16">
          <div className="flex flex-1 flex-col gap-2">
            {session.data && (
              <Link
                to="/users/$userid"
                params={{ userid: session.data.user.id }}
                activeProps={{
                  className:
                    "bg-secondary/20 border-secondary/20 border shadow-md",
                }}
                onClick={closeMenu}
                className={cn(
                  "card card-compac rounded-lg border border-secondary/0 bg-base-100 transition",
                  "flex flex-row items-center gap-3 p-3",
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <Avatar
                    name={session.data.user.name}
                    image={session.data.user.image}
                    size="sm"
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">
                      {session.data.user.displayUsername}
                    </span>
                    <span className="text-base-content/70 text-xs">
                      @{session.data.user.username}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            <Link
              to="/"
              className="btn btn-ghost justify-start gap-3 rounded-md"
              activeProps={{
                className: "bg-secondary/20 border-secondary/20 shadow-md",
              }}
              onClick={closeMenu}
            >
              <Home size={20} />
              <span>Feed</span>
            </Link>

            {session.data && (
              <Link
                to="/following"
                className="btn btn-ghost justify-start gap-3 rounded-md"
                activeProps={{
                  className: "bg-secondary/20 border-secondary/20 shadow-md",
                }}
                onClick={closeMenu}
              >
                <Users size={20} />
                <span>Following</span>
              </Link>
            )}

            {session.data && (
              <Link
                to="/notifications"
                className="btn btn-ghost items-center justify-start gap-3 rounded-md"
                activeProps={{
                  className: "bg-secondary/20 border-secondary/20 shadow-md",
                }}
                onClick={closeMenu}
              >
                <Bell size={20} />
                <p>Notifications</p>
                <span
                  className={cn("badge badge-secondary", {
                    hidden:
                      !isSuccess ||
                      (data?.pages[0]?.notifications[0]?.unreadCount ?? 0) ===
                        0,
                  })}
                >
                  {data?.pages[0]?.notifications[0]?.unreadCount ?? 0}
                </span>
              </Link>
            )}

            <Link
              to="/bookmarks"
              className="btn btn-ghost justify-start gap-3 rounded-md"
              activeProps={{
                className: "bg-secondary/20 border-secondary/20 shadow-md",
              }}
              onClick={closeMenu}
            >
              <Bookmark size={20} />
              <span>Bookmarks</span>
            </Link>

            <Link
              to="/users/$userid/follow-requests"
              params={{ userid: session.data?.user.id }}
              className="btn btn-ghost justify-start gap-3 rounded-md"
              activeProps={{
                className: "bg-secondary/20 border-secondary/20 shadow-md",
              }}
              onClick={closeMenu}
            >
              <UserCheck size={20} />
              <span>Follow Requests</span>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              to="/settings"
              className="btn btn-ghost justify-start gap-3 rounded-md"
              activeProps={{
                className: "bg-secondary/20 border-secondary/20 shadow-md",
              }}
              onClick={closeMenu}
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                signOutMutation.mutate();
                closeMenu();
              }}
              className="btn btn-ghost justify-start gap-3 rounded-md hover:text-error"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
            <div className="justify-start gap-3 py-1 pl-4">
              <ThemeController />
            </div>
          </div>
        </div>
      </div>
    </Activity>
  );
}
