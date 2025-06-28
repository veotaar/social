import { betterAuth } from "better-auth";
import {
  haveIBeenPwned,
  openAPI,
  admin,
  username,
  twoFactor,
} from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/db";
import {
  user,
  session,
  account,
  verification,
  twoFactor as tf,
} from "@/db/schema";
import { sendTestEmail } from "./email";

export const auth = betterAuth({
  appName: "Social App",
  trustedOrigins: ["http://localhost:3001"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      twoFactor: tf,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: (password) =>
        Bun.password.hash(password, {
          algorithm: "argon2id",
          timeCost: 3,
        }),
      verify: ({ hash, password }) => Bun.password.verify(password, hash),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendTestEmail({
        toEmail: user.email,
        toUser: user.name,
        subject: "Verify your email address",
        url,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      followersCount: {
        type: "number",
        defaultValue: 0,
      },
      followingCount: {
        type: "number",
        defaultValue: 0,
      },
      postsCount: {
        type: "number",
        defaultValue: 0,
      },
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
  plugins: [
    twoFactor(),
    admin(),
    openAPI(),
    haveIBeenPwned({
      customPasswordCompromisedMessage: "Please choose a more secure password.",
    }),
    username({
      usernameValidator: (username) => {
        if (username === "admin") {
          return false;
        }
        return true;
      },
      minUsernameLength: 5,
      maxUsernameLength: 30,
    }),
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
