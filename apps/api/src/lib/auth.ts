import { betterAuth } from "better-auth";
import {
  haveIBeenPwned,
  openAPI,
  admin,
  username,
  twoFactor,
  anonymous,
} from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@api/db/db";
import { table } from "@api/db/model";
import { sendTestEmail } from "./email";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { getCachedSettings } from "@api/modules/settings/service";
import { redis } from "bun";
import env from "@api/env";
import { invalidateUserProfileCache } from "./cache";

export const auth = betterAuth({
  appName: "Social App",
  basePath: "/api/auth",
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
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/anonymous") {
        const settings = await getCachedSettings();
        if (!settings?.allowGuestLogin) {
          throw new APIError("FORBIDDEN", {
            message: "Guest login is disabled",
          });
        }
      } else if (ctx.path === "/sign-up/email") {
        const settings = await getCachedSettings();
        if (!settings?.allowSignup) {
          throw new APIError("FORBIDDEN", {
            message: "Sign up is disabled",
          });
        }
      }
    }),
  },
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
              username:
                user.name.replaceAll(" ", "").toLowerCase() +
                Math.floor(Math.random() * 10000),
              displayUsername: user.name,
              bio: "guest user",
            },
          };
        },
      },
      update: {
        after: async (user) => {
          await invalidateUserProfileCache(user.id);
          return;
        },
      },
    },
  },
  rateLimit: {
    enabled: env.NODE_ENV !== "development",
    customRules: {
      "/get-session": false,
      "/sign-in/anonymous": async (request) => {
        return {
          window: 3600, // seconds (1 hour)
          max: 1, // max 1 request per window per IP
        };
      },
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
      generateName: () =>
        uniqueNamesGenerator({
          dictionaries: [adjectives, colors, animals],
          separator: " ",
          style: "capital",
          length: 3,
        }),
    }),
  ],
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value);
        await redis.expire(key, ttl);
      } else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
