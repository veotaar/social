import {
  createFileRoute,
  Outlet,
  Link,
  Navigate,
} from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Navigate to="/settings/blocked" viewTransition={false} />
      <div>
        <h1 className="m-auto mt-8 mb-4 max-w-4xl px-2 font-bold text-3xl">
          Settings
        </h1>
      </div>
      <div className="mx-auto mt-4 grid min-h-screen max-w-4xl grid-cols-2 border border-base-300">
        <div className="border-r border-r-base-300">
          <div>
            <Link
              className="card rounded-none bg-base-200 p-4 text-lg hover:bg-base-300"
              to="/settings/blocked"
              activeProps={{ className: "bg-base-300" }}
            >
              Blocked Accounts
            </Link>
          </div>
        </div>
        <div>
          <Outlet />
        </div>
      </div>
    </>
  );
}
