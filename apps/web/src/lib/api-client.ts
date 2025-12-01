import { treaty } from "@elysiajs/eden";
import type { App } from "@api/index";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:3000";

export const client = treaty<App>(API_URL, {
  fetch: {
    credentials: "include",
  },
});
