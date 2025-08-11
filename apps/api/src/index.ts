import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { OpenAPI } from "./lib/authOpenApi";
import env from "./env";
import { betterAuth } from "./modules/auth";
import { postRoute } from "./modules/post";
import { blockRoute } from "./modules/block";
import { commentRoute } from "./modules/comment";

const ip = new Elysia()
  .derive({ as: "global" }, ({ server, request }) => ({
    ip: server?.requestIP(request),
  }))
  .get("/ip", ({ ip }) => ip);

const app = new Elysia()
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
  .use(commentRoute)
  .listen(env.PORT);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
