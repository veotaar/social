import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useBlocker } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { signUp, isUsernameAvailable } from "@web/lib/auth-client";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import FieldInfo from "../components/FieldInfo";
import GuestLoginButton from "@web/components/guest-login-button/GuestLogin";
import { useGetSystemSettings } from "@web/hooks/useGetSystemSettings";
import { TriangleAlert, Info, CircleCheck } from "lucide-react";

const registerSearchSchema = z.object({
  redirect: z.string().default("/"),
});

export const Route = createFileRoute("/register")({
  validateSearch: zodValidator(registerSearchSchema),
  beforeLoad: ({ search, context: { auth } }) => {
    if (auth.isAuthenticated) {
      throw redirect({ to: search.redirect });
    }
  },
  component: RegisterComponent,
});

const registerFormSchema = z.object({
  name: z.string().min(5).max(64),
  username: z.string().min(5).max(30),
  displayUsername: z.string().min(0).max(30).optional(),
  email: z.email(),
  password: z.string().min(8).max(100),
});

const defaultValues: z.input<typeof registerFormSchema> = {
  name: "",
  email: "",
  password: "",
  username: "",
  displayUsername: "",
};

function RegisterComponent() {
  const navigate = Route.useNavigate();
  const [signupError, setSignupError] = useState<{
    code?: string;
    message?: string;
  } | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const { data: systemData, isLoading: isSystemLoading } =
    useGetSystemSettings();

  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data: response, error } = await isUsernameAvailable({
        username,
      });
      if (error) throw error;
      return response;
    },
  });

  const signupUserMutation = useMutation({
    mutationFn: async (value: z.infer<typeof registerFormSchema>) => {
      const { data, error } = await signUp.email({
        email: value.email,
        password: value.password,
        name: value.name,
        username: value.username,
        displayUsername: value.displayUsername ?? value.name,
        // callbackURL: "/",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsRegistered(true);
    },
  });

  useEffect(() => {
    if (isRegistered) {
      navigate({ to: "/login", search: { registered: true } });
    }
  }, [isRegistered, navigate]);

  const form = useForm({
    defaultValues,
    validators: {
      onChange: registerFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        setSignupError(null);
        await signupUserMutation.mutateAsync(value);
        formApi.reset();
      } catch (error) {
        const err = error as { code?: string; message?: string };
        setSignupError(err);
      }
    },
  });

  useBlocker({
    shouldBlockFn: () => {
      if (isRegistered || !form.state.isDirty) return false;

      const shouldLeave = confirm("Are you sure you want to leave?");
      return !shouldLeave;
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

  if (!systemData?.allowSignup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-3xl">Registration Closed</h2>
            <div className="alert alert-info mt-4 rounded-md">
              <Info className="h-6 w-6 shrink-0" />
              <span>New registrations are currently disabled.</span>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link to="/login" className="btn btn-primary">
                Sign In
              </Link>
              {systemData?.allowGuestLogin && <GuestLoginButton />}
              <Link to="/" className="btn btn-ghost">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-6 justify-center text-3xl">Register</h2>
          {signupError && (
            <div
              className={`alert mb-4 rounded-md ${
                signupError.code === "PASSWORD_COMPROMISED"
                  ? "alert-warning"
                  : "alert-error"
              }`}
            >
              <TriangleAlert className="h-5 w-5 shrink-0" />
              <span>
                {signupError.message ||
                  "An error occurred during signup. Please try again."}
              </span>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <form.Field
              name="name"
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="name">
                    <span className="label-text">
                      Name <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Your Name"
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
              name="email"
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="email">
                    <span className="label-text">
                      Email <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="email@example.com"
                    className="input input-bordered w-full rounded-md "
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
              name="username"
              validators={{
                onChangeAsyncDebounceMs: 500,
                onChangeAsync: async ({ value }) => {
                  if (!value) {
                    return undefined;
                  }
                  if (value.length < 5) {
                    return "Username must be at least 5 characters";
                  }
                  try {
                    const response =
                      await checkUsernameMutation.mutateAsync(value);
                    if (!response?.available) {
                      return "Username is already taken";
                    }
                  } catch (error) {
                    return "Error checking username availability";
                  }
                  return undefined;
                },
              }}
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="username">
                    <span className="label-text">
                      Username <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    placeholder="username"
                    className="input input-bordered w-full rounded-md "
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  <div className="min-h-6">
                    <FieldInfo field={field} />
                    {field.state.meta.isTouched &&
                      field.state.meta.isValid &&
                      !field.state.meta.isValidating &&
                      field.state.value.length >= 5 && (
                        <span className="flex items-center gap-1 text-sm text-success">
                          <CircleCheck className="h-4 w-4" />
                          Username is available
                        </span>
                      )}
                  </div>
                </div>
              )}
            />

            <form.Field
              name="displayUsername"
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="displayUsername">
                    <span className="label-text">
                      Display Username (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="displayUsername"
                    placeholder="display username"
                    className="input input-bordered w-full rounded-md "
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
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
                    <span className="label-text">
                      Password <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="password"
                    className="input input-bordered w-full rounded-md "
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
                {signupUserMutation.isPending ? "Loading..." : "Sign Up"}
              </button>
            </div>
          </form>
          <div className="mt-6 flex justify-center">
            <Link to="/login" className="text-blue-500 hover:underline">
              Already have an account? Login
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
