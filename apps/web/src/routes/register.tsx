import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { signUp } from "@web/lib/auth-client";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import FieldInfo from "../components/FieldInfo";
import GuestLoginButton from "@web/components/guest-login-button/GuestLogin";

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

  const signupUserMutation = useMutation({
    mutationFn: async (value: z.infer<typeof registerFormSchema>) => {
      await signUp.email({
        email: value.email,
        password: value.password,
        name: value.name,
        username: value.username,
        displayUsername: value.displayUsername,
        callbackURL: "/",
      });
    },
    onSuccess: () => {
      navigate({ to: "/" });
    },
  });

  const form = useForm({
    defaultValues,
    validators: {
      onChange: registerFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await signupUserMutation.mutateAsync(value);
      formApi.reset();
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-6 justify-center text-3xl">Register</h2>
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
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Your Name"
                    className="input input-bordered w-full"
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
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="email@example.com"
                    className="input input-bordered w-full"
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
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="username">
                    <span className="label-text">Username</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    placeholder="username"
                    className="input input-bordered w-full"
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
              name="displayUsername"
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="displayUsername">
                    <span className="label-text">Display Username</span>
                  </label>
                  <input
                    type="text"
                    id="displayUsername"
                    placeholder="display username"
                    className="input input-bordered w-full"
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
                    <span className="label-text">password</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="password"
                    className="input input-bordered w-full"
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
          <div className="divider">OR</div>
          <GuestLoginButton />
        </div>
      </div>
    </div>
  );
}
