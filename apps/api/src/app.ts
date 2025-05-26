import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/configure-open-api";
import index from "@/routes/index.route";

const app = createApp();

const routes = [index];

configureOpenAPI(app);

for (const route of routes) {
  app.route("/", route);
}

export default app;
