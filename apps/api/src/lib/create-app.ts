import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { pinoLogger } from "hono-pino";
import type { AppBindings } from "@/lib/types";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import pino from "pino";
import pretty from "pino-pretty";
import env from "@/env";
import { defaultHook } from "stoker/openapi";

export const createRouter = () => {
  return new OpenAPIHono<AppBindings>({
    defaultHook,
  });
};

const createApp = () => {
  const app = createRouter();

  app.use(serveEmojiFavicon("🔥"));

  app
    .use(
      requestId({
        generator: () => Bun.randomUUIDv7(),
      }),
    )
    .use(
      pinoLogger({
        pino: pino(
          {
            level: env.LOG_LEVEL || "info",
          },
          env.NODE_ENV === "production" ? undefined : pretty(),
        ),
      }),
    );

  app.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  });

  app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

  app.use(
    "/api/auth/*",
    cors({
      origin: "http://localhost:3000",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    }),
  );

  app.notFound(notFound);
  app.onError(onError);

  return app;
};

export default createApp;
