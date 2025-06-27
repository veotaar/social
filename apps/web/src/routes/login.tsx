import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-6 justify-center">Login</h2>
          <form>
            <div className="mb-4">
              <label className="label" htmlFor="email">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                id="email"
                placeholder="email@example.com"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="mb-6">
              <label className="label" htmlFor="password">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                id="password"
                placeholder="password"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="mt-6">
              <button type="submit" className="btn btn-primary w-full">
                Login
              </button>
            </div>
          </form>
          <div className="flex gap-1 justify-center mt-6">
            <Link to="/" className="text-blue-500 hover:underline">
              Don't have an account? Register
            </Link>
            <Link to="/">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
