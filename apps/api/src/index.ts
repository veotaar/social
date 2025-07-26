import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { OpenAPI } from "./lib/authOpenApi";
import env from "./env";
import logixlysia from "logixlysia";
import { betterAuth } from "./modules/auth";
import { postRoute } from "./modules/post";
import { blockRoute } from "./modules/block";

const ip = new Elysia()
  .derive({ as: "global" }, ({ server, request }) => ({
    ip: server?.requestIP(request),
  }))
  .get("/ip", ({ ip }) => ip);

const app = new Elysia()
  .use(
    logixlysia({
      config: {
        showStartupMessage: false,
        timestamp: {
          translateTime: "yyyy-mm-dd HH:MM:ss.SSS",
        },
        logFilePath: "./logs/example.log",
        ip: true,
        customLogFormat:
          "🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip}",
      },
    }),
  )
  .use(
    cors({
      origin: "http://localhost:3001",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(betterAuth)
  .use(ip)
  .use(
    swagger({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .get("/", () => "hello")
  .use(postRoute)
  .use(blockRoute)
  .listen(env.PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
