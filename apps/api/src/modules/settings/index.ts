import { Elysia, NotFoundError, t } from "elysia";
import { getCachedSettings } from "./service";

export const settingsRoute = new Elysia().get("/settings", async () => {
  const settings = await getCachedSettings();
  if (!settings) throw new NotFoundError("Settings not found");

  return settings;
});
