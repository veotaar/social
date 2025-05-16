import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";

// biome-ignore lint/style/noNonNullAssertion:
const client = new SQL(process.env.DATABASE_URL!);
export const db = drizzle({ client });
