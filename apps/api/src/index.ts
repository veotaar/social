import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import env from "./env";
import { OpenAPI } from "./lib/authOpenApi";
import { betterAuth } from "./modules/auth";
import { blockRoute } from "./modules/block";
import { postsRoute } from "./modules/posts";
import { usersRoute } from "./modules/users";
import { notificationsRoute } from "./modules/users/notifications";
import { followsRoute } from "./modules/users/follows";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:3001",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .onRequest(({ request }) => {
    if (request.method === "OPTIONS" || env.NODE_ENV === "production") {
      return;
    }
    if (request.url.endsWith("/api/get-session")) {
      console.log(Date.now(), "+++++++ [SESSION REQUEST] ++++++");
    }
  })
  .use(betterAuth)
  .use(
    swagger({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .get("/health", () => "OK")
  .use(postsRoute)
  .use(blockRoute)
  .use(usersRoute)
  .use(notificationsRoute)
  .use(followsRoute)
  .listen(env.PORT);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
