import { createRouter } from "@/lib/create-app";
import type { AppOpenAPI } from "@/lib/types";

import index from "./index.route";

export const registerRoutes = (app: AppOpenAPI) => {
  return app.route("/", index);
};

export const router = registerRoutes(createRouter().basePath("/api"));

export type router = typeof router;
