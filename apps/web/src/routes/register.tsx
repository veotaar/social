import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { signUp } from "@web/lib/auth-client";
import z from "zod/v4";

import FieldInfo from "../components/FieldInfo";

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

const registerFormSchema = z.object({
  name: z.string().min(5).max(30),
  email: z.email(),
  password: z.string().min(8).max(100),
});

const defaultValues: z.input<typeof registerFormSchema> = {
  name: "",
  email: "",
  password: "",
};

function RegisterComponent() {
  const navigate = Route.useNavigate();

  const signupUserMutation = useMutation({
    mutationFn: async (value: z.infer<typeof registerFormSchema>) => {
      await signUp.email({
        email: value.email,
        password: value.password,
        name: value.name,
        // role: "user",
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
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl mb-6 justify-center">Register</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <form.Field
              name="name"
              children={(field) => (
                <div>
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
                  <FieldInfo field={field} />
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
                  <FieldInfo field={field} />
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
                  <FieldInfo field={field} />
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
          <div className="flex justify-center mt-6">
            <Link to="/login" className="text-blue-500 hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
