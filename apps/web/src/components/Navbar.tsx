import { useSession, signOut } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";

export function Navbar() {
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
            <Link to="/about" className="[&.active]:font-bold">
              About
            </Link>
          </li>
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
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => logout()}
              >
                Logout
              </button>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
