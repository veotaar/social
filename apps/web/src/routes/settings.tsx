import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="m-auto mt-12 min-h-svh max-w-3xl p-2">
      Hello "/settings"!
    </div>
  );
}
