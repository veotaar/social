import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notifications")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="m-auto mt-12 h-full max-w-3xl p-2">
      Hello "/notifications"!
    </div>
  );
}
