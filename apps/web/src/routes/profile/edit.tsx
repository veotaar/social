import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSession } from "@web/lib/auth-client";
import { client } from "@web/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUsernameAvailable } from "@web/lib/auth-client";
import z from "zod/v4";
import { useForm } from "@tanstack/react-form";
import FieldInfo from "@web/components/FieldInfo";

export const Route = createFileRoute("/profile/edit")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/profile/edit" },
      });
    }
  },
  component: RouteComponent,
});

const profileFormSchema = z.object({
  username: z.string().min(5, "Username must be at least 5 characters"),
  name: z.string().min(1, "Name is required"),
  displayUsername: z.string().max(30).optional(),
  // image: z.string().url().nullable().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function RouteComponent() {
  const { auth } = Route.useRouteContext();

  // biome-ignore lint/style/noNonNullAssertion: session is checked in beforeLoad
  const sessionData = auth.session!;

  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();

  const { data: userData, isLoading } = useQuery({
    enabled: !!sessionData,
    queryKey: ["user", sessionData?.user.id],
    queryFn: async () => {
      const { data, error } = await client
        // biome-ignore lint/style/noNonNullAssertion: query only runs if sessionData is defined
        .users({ userid: sessionData!.user.id })
        .get();
      if (error) throw error.status;
      return data;
    },
  });

  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data: response, error } = await isUsernameAvailable({
        username,
      });
      if (error) throw error;
      return response;
    },
  });

  const updateUserMutation = useMutation({
    mutationKey: ["updateUser"],
    mutationFn: async (values: ProfileFormValues) => {
      const { data, error } = await client
        .users({ userid: sessionData.user.id })
        .put({
          username: values.username,
          name: values.name,
          displayUsername: values.displayUsername || undefined,
          // image: values.image,
          bio: values.bio,
        });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user", sessionData.user.id],
      });
      await navigate({
        to: `/profile/${sessionData.user.id}`,
        reloadDocument: true,
      });
    },
  });

  const form = useForm({
    defaultValues: {
      username: userData?.username || "",
      name: userData?.name || "",
      displayUsername: userData?.displayUsername || "",
      // image: userData?.image || null,
      bio: userData?.bio || "",
    } as ProfileFormValues,
    validators: {
      onChange: profileFormSchema,
    },
    onSubmit: async ({ value }) => {
      await updateUserMutation.mutateAsync(value);
    },
  });

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 py-8">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-6 justify-center text-3xl">
            Edit Profile
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <form.Field
              name="username"
              validators={{
                onChangeAsyncDebounceMs: 500,
                onChangeAsync: async ({ value }) => {
                  if (!value || value === userData.username) {
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
                    <span className="label-text">Username</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    placeholder="username"
                    className="input input-bordered w-full"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                  <div className="min-h-6">
                    <FieldInfo field={field} />
                  </div>
                </div>
              )}
            />

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
                    onBlur={field.handleBlur}
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
                    placeholder="Display username (optional)"
                    className="input input-bordered w-full"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <div className="min-h-6">
                    <FieldInfo field={field} />
                  </div>
                </div>
              )}
            />

            {/* <form.Field
              name="image"
              children={(field) => (
                <div className="mb-4">
                  <label className="label" htmlFor="image">
                    <span className="label-text">Profile Image URL</span>
                  </label>
                  <input
                    type="url"
                    id="image"
                    placeholder="https://example.com/image.jpg"
                    className="input input-bordered w-full"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            /> */}

            <form.Field
              name="bio"
              children={(field) => (
                <div className="mb-6">
                  <label className="label" htmlFor="bio">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    className="textarea textarea-bordered w-full"
                    rows={4}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <div className="min-h-6">
                    <FieldInfo field={field} />
                  </div>
                </div>
              )}
            />

            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                onClick={form.handleSubmit}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() =>
                  navigate({ to: `/profile/${sessionData.user.id}` })
                }
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </button>
            </div>

            {updateUserMutation.isError && (
              <div className="alert alert-error mt-4">
                <span>Failed to update profile. Please try again.</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
