import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/configure-open-api";
import index from "@/routes/index.route";
import { showRoutes } from "hono/dev";

const app = createApp();

const routes = [index];

configureOpenAPI(app);

for (const route of routes) {
  app.route("/", route);
}

showRoutes(app);

export type AppType = (typeof routes)[number];

export default app;
