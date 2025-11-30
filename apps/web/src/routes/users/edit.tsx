import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSession } from "@web/lib/auth-client";
import { client } from "@web/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUsernameAvailable } from "@web/lib/auth-client";
import z from "zod/v4";
import { useForm } from "@tanstack/react-form";
import FieldInfo from "@web/components/FieldInfo";
import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import Avatar from "@web/components/avatar/Avatar";

export const Route = createFileRoute("/users/edit")({
  beforeLoad: async ({ context: { auth } }) => {
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: "/users/edit" },
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

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: userData, isLoading } = useQuery({
    enabled: !!sessionData,
    queryKey: ["user", sessionData?.user.id],
    queryFn: async () => {
      const { data, error } = await client.api
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
      let imageUrl: string | undefined;

      // Upload profile image if one is selected
      if (profileImage) {
        setIsUploadingImage(true);
        try {
          const { data, error } = await client.api.upload.image.post({
            file: profileImage,
            type: "profile",
          });

          if (error || !data) {
            throw new Error("Failed to upload image");
          }

          imageUrl = data.url;
        } finally {
          setIsUploadingImage(false);
        }
      }

      const { data, error } = await client.api
        .users({ userid: sessionData.user.id })
        .put({
          username: values.username,
          name: values.name,
          displayUsername: values.displayUsername || undefined,
          image: imageUrl,
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
        to: `/users/${sessionData.user.id}`,
        reloadDocument: true,
      });
    },
  });

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeProfileImage = () => {
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImage(null);
    setProfileImagePreview(null);
  };

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
            {/* Profile Image Upload */}
            <div className="mb-6 flex flex-col items-center">
              <span className="label-text mb-2">Profile Picture</span>
              <div className="relative">
                {profileImagePreview ? (
                  <div className="relative">
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeProfileImage}
                      className="-right-1 -top-1 btn btn-circle btn-error btn-xs absolute"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Avatar
                    name={userData?.name || ""}
                    image={userData?.image}
                    size="lg"
                  />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleProfileImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost btn-sm mt-2"
              >
                <ImagePlus className="mr-1 h-4 w-4" />
                {profileImagePreview || userData?.image
                  ? "Change Photo"
                  : "Add Photo"}
              </button>
            </div>

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
                    className="input input-bordered w-full rounded-md"
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
                    className="input input-bordered w-full rounded-md"
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
                    className="input input-bordered w-full rounded-md"
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
                    className="textarea textarea-bordered w-full rounded-md"
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
                disabled={updateUserMutation.isPending || isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <span className="loading loading-spinner" />
                    Uploading...
                  </>
                ) : updateUserMutation.isPending ? (
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
                  navigate({ to: `/users/${sessionData.user.id}` })
                }
                disabled={updateUserMutation.isPending || isUploadingImage}
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
