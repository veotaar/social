import createApp from "@/lib/create-app";

const app = createApp();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/error", (c) => {
  c.status(451);
  c.var.logger.info("test");
  throw new Error("test");
});

export default app;
