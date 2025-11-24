import { cors } from "@elysiajs/cors";
import { openapi, fromTypes } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";
import env from "./env";
import { OpenAPI } from "./lib/authOpenApi";
import { betterAuth } from "./modules/auth";
import { blockRoute } from "./modules/block";
import { postsRoute } from "./modules/posts";
import { usersRoute } from "./modules/users";
import { notificationsRoute } from "./modules/users/notifications";
import { followsRoute } from "./modules/users/follows";
import { userBlocksRoute } from "./modules/users/blocks";
import { userBookmarksRoute } from "./modules/users/bookmarks";
import { adminRoute } from "./modules/admin";
import { settingsRoute } from "./modules/settings";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:3001",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "User-Agent"],
    }),
  )
  .use(
    openapi({
      references: fromTypes(),
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
      path: "/openapi",
    }),
  )
  .use(betterAuth)
  .get("/health", () => "OK")
  .use(postsRoute)
  .use(blockRoute)
  .use(usersRoute)
  .use(notificationsRoute)
  .use(followsRoute)
  .use(userBlocksRoute)
  .use(userBookmarksRoute)
  .use(adminRoute)
  .use(settingsRoute)
  .listen(env.PORT);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
