import { betterAuth } from "better-auth";
import {
  haveIBeenPwned,
  openAPI,
  admin,
  username,
  twoFactor,
  anonymous,
} from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@api/db/db";
import { table } from "@api/db/model";
import { sendTestEmail } from "./email";

export const auth = betterAuth({
  appName: "Social App",
  basePath: "/api",
  trustedOrigins: ["http://localhost:3001", "http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: table.user,
      session: table.session,
      account: table.account,
      verification: table.verification,
      twoFactor: table.twoFactor,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path !== "/sign-in/anonymous") {
            return {
              data: {
                ...user,
              },
            };
          }

          return {
            data: {
              ...user,
              username: `anon_${crypto.randomUUID().split("-")[0]}`,
              displayUsername: `anon_${crypto.randomUUID().split("-")[0]}`,
              bio: "anonymous user",
            },
          };
        },
      },
    },
  },
  rateLimit: {
    customRules: {
      "/get-session": false,
    },
  },
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
    sendVerificationEmail: async ({ user, token }) => {
      await sendTestEmail({
        toEmail: user.email,
        toUser: user.name,
        subject: "Verify your email address",
        token,
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
    anonymous({
      emailDomainName: "example.com",
      generateName: () => `Anon_${crypto.randomUUID().split("-")[0]}`,
    }),
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
