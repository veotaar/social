import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { signIn } from "@web/lib/auth-client";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import FieldInfo from "../components/FieldInfo";
import GuestLoginButton from "@web/components/guest-login-button/GuestLogin";
import { useGetSystemSettings } from "@web/hooks/useGetSystemSettings";
import { TriangleAlert } from "lucide-react";

const loginSearchSchema = z.object({
  redirect: z.string().default("/"),
});

export const Route = createFileRoute("/login")({
  validateSearch: zodValidator(loginSearchSchema),
  beforeLoad: ({ search, context: { auth } }) => {
    if (auth.isAuthenticated) {
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginComponent,
});

const loginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
});

const defaultValues: z.input<typeof loginFormSchema> = {
  email: "",
  password: "",
};

function LoginComponent() {
  const navigate = Route.useNavigate();

  const { data: systemData, isLoading: isSystemLoading } =
    useGetSystemSettings();

  const signInUserMutation = useMutation({
    mutationFn: async (value: z.infer<typeof loginFormSchema>) => {
      await signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: "/",
      });
    },
    onSuccess: async () => {
      await navigate({ to: "/" });
    },
  });

  const form = useForm({
    defaultValues,
    validators: {
      onChange: loginFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await signInUserMutation.mutateAsync(value);
      formApi.reset();
    },
  });

  if (isSystemLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-4 text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (systemData?.maintenanceMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-3xl">Maintenance Mode</h2>
            <div className="alert alert-warning mt-4 rounded-md">
              <TriangleAlert className="h-6 w-6 shrink-0" />
              <span>The site is currently under maintenance.</span>
            </div>
            <Link to="/" className="btn btn-ghost mt-4">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-6 justify-center text-3xl">Login</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <form.Field
              name="email"
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="email">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="email@example.com"
                    className="input input-bordered w-full rounded-md"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                  <div className="min-h-6">
                    <FieldInfo field={field} />
                  </div>
                </div>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <div className="mb-6">
                  <label className="label" htmlFor="password">
                    <span className="label-text">password</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="password"
                    className="input input-bordered w-full rounded-md"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                  <div className="min-h-6">
                    <FieldInfo field={field} />
                  </div>
                </div>
              )}
            />

            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                onClick={form.handleSubmit}
              >
                {signInUserMutation.isPending ? "Loading..." : "Login"}
              </button>
            </div>
          </form>
          <div className="mt-6 flex justify-center">
            <Link to="/register" className="text-blue-500 hover:underline">
              Don't have an account? Sign up.
            </Link>
          </div>
          {systemData?.allowGuestLogin && (
            <>
              <div className="divider">OR</div>
              <GuestLoginButton />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
