import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  fetchOptions: {
    credentials: "include",
  },

  plugins: [usernameClient()],

  baseURL: "http://localhost:3000",
  basePath: "/auth/api",
});

export const {
  useSession,
  signIn,
  signOut,
  signUp,
  forgetPassword,
  resetPassword,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
