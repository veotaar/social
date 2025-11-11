import { useSession, signOut } from "@web/lib/auth-client";
import { Link } from "@tanstack/react-router";
import Avatar from "./avatar/Avatar";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isdark, setIsdark] = useState<boolean>(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isdark) {
      document.documentElement.dataset.theme = "dracula";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.dataset.theme = "silk";
      localStorage.setItem("theme", "light");
    }
  }, [isdark]);

  const session = useSession();

  console.log(session);

  const logout = async () => {
    await signOut();
  };

  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          SocialApp
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            {!session.data && (
              <Link to="/login" className="[&.active]:font-bold">
                Login
              </Link>
            )}
          </li>
          <li>
            {!session.data && (
              <Link to="/register" className="[&.active]:font-bold">
                Register
              </Link>
            )}
          </li>
          <li>
            {session.data && (
              <div className="dropdown dropdown-end p-0">
                <button
                  type="button"
                  className="btn btn-ghost flex items-center gap-2 p-6 hover:bg-neutral"
                >
                  <Avatar
                    name={session.data.user.name}
                    image={session.data.user.image}
                    size="sm"
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">
                      {session.data.user.name}
                    </span>
                    <span className="text-xs opacity-70">
                      @{session.data.user.username}
                    </span>
                  </div>
                </button>
                <ul className="menu menu-md dropdown-content z-1 mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
                  <li>
                    <Link
                      to="/profile/$userid"
                      params={{ userid: session.data.user.id }}
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      className="text-error"
                      type="button"
                      onClick={() => logout()}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="justify-center">
            <div className="tooltip tooltip-bottom" data-tip="Theme">
              <input
                type="checkbox"
                value={isdark ? "dracula" : "silk"}
                checked={isdark}
                onChange={() => setIsdark(!isdark)}
                className="toggle theme-controller "
              />
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
