import { drizzle } from "drizzle-orm/bun-sql";
import env from "@/env";
import * as schema from "@/db/schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export type db = typeof db;

export default db;
