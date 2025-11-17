import { Link, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Bell,
  Bookmark,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import ThemeController from "@web/components/theme-controller/ThemeController";
import { useSession, signOut } from "@web/lib/auth-client";
import { Activity } from "react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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

  return (
    <Activity mode={session.data ? "visible" : "hidden"}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-square fixed top-4 left-4 z-50 xl:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 xl:hidden"
          onClick={closeMenu}
          onKeyDown={(e) => e.key === "Escape" && closeMenu()}
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-base-300 bg-base-100 p-4 transition-transform duration-300 ease-in-out xl:translate-x-0 xl:border-r",
          {
            "translate-x-0": isOpen,
            "-translate-x-full": !isOpen,
          },
        )}
      >
        <div className="flex h-full flex-col justify-between pt-16">
          <div className="flex flex-1 flex-col gap-2">
            <Link
              to="/"
              className="btn btn-ghost justify-start gap-3"
              activeProps={{ className: "btn-active" }}
              onClick={closeMenu}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>

            {session.data && (
              <Link
                to="/notifications"
                className="btn btn-ghost justify-start gap-3"
                activeProps={{ className: "btn-active" }}
                onClick={closeMenu}
              >
                <Bell size={20} />
                <span>Notifications</span>
              </Link>
            )}

            <Link
              to="/bookmarks"
              className="btn btn-ghost justify-start gap-3"
              activeProps={{ className: "btn-active" }}
              onClick={closeMenu}
            >
              <Bookmark size={20} />
              <span>Bookmarks</span>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {session.data && (
              <Link
                to="/users/$userid"
                params={{ userid: session.data.user.id }}
                className="btn btn-ghost justify-start gap-3"
                activeProps={{ className: "btn-active" }}
                onClick={closeMenu}
              >
                <User size={20} />
                <span>Profile</span>
              </Link>
            )}

            <Link
              to="/settings"
              className="btn btn-ghost justify-start gap-3"
              activeProps={{ className: "btn-active" }}
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
              className="btn btn-ghost justify-start gap-3 hover:text-error"
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
