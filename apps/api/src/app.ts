import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { type PinoLogger, pinoLogger } from "hono-pino";
import { notFound, onError } from "stoker/middlewares";
import pino from "pino";
import pretty from "pino-pretty";

const app = new OpenAPIHono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    logger: PinoLogger;
  };
}>();

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
          level: process.env.LOG_LEVEL || "info",
        },
        process.env.NODE_ENV === "production" ? undefined : pretty(),
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

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/error", (c) => {
  c.status(451);
  c.var.logger.info("test");
  throw new Error("test");
});

app.notFound(notFound);
app.onError(onError);

export default app;
