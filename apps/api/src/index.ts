import { cors } from "@elysiajs/cors";
import { openapi, fromTypes } from "@elysiajs/openapi";
import { serverTiming } from "@elysiajs/server-timing";
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
import { uploadRoute } from "./modules/upload";
import { auth } from "./lib/auth";
import {
  generateConnectionId,
  registerConnection,
  unregisterConnection,
  type WSMessage,
} from "./lib/ws";

const wsRoute = new Elysia()
  .use(betterAuth)
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return {
      wsSession: session,
    };
  })
  .resolve(({ wsSession }) => {
    return {
      userId: wsSession?.user.id ?? "",
      connectionId: generateConnectionId(),
    };
  })
  .ws("/ws", {
    // validate incoming WebSocket messages
    body: t.Optional(
      t.Object({
        type: t.String(),
        payload: t.Optional(t.Unknown()),
      }),
    ),
    // beforeHandle runs before upgrading connection to WebSocket
    beforeHandle({ wsSession, status }) {
      if (!wsSession?.user) {
        return status(401, "Unauthorized: Invalid session");
      }
    },
    message(ws, message) {
      if (message?.type === "ping") {
        ws.send({ type: "pong" });
      }
    },
    open(ws) {
      const { userId, connectionId } = ws.data;

      // register this connection
      registerConnection(userId, connectionId, ws);

      // send connection confirmation
      const message: WSMessage = {
        type: "connected",
        payload: { userId },
      };
      ws.send(message);
    },
    close(ws) {
      const { userId, connectionId } = ws.data;
      unregisterConnection(userId, connectionId);
    },
  });

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: "http://localhost:3001",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "User-Agent"],
    }),
  )
  .use(serverTiming())
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
  .use(uploadRoute)
  .use(wsRoute)
  .listen(env.PORT);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
