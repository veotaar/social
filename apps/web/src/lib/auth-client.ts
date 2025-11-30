import {
  usernameClient,
  anonymousClient,
  adminClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  fetchOptions: {
    credentials: "include",
  },

  plugins: [usernameClient(), anonymousClient(), adminClient()],

  baseURL: "http://localhost:3000",
  basePath: "/api/auth",

  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

export const {
  useSession,
  signIn,
  admin,
  signOut,
  signUp,
  resetPassword,
  isUsernameAvailable,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
