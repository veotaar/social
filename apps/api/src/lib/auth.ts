import { betterAuth } from "better-auth";
import { haveIBeenPwned, openAPI, admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/bun-sql";

// biome-ignore lint/style/noNonNullAssertion:
export const db = drizzle(process.env.DATABASE_URL!);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin(), openAPI(), haveIBeenPwned()],
});
