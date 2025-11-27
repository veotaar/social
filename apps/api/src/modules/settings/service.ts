import db from "@api/db/db";
import { table } from "@api/db/model";
import { eq } from "drizzle-orm";
import {
  getCachedSystemSettings,
  setCachedSystemSettings,
  invalidateSystemSettingsCache,
} from "@api/lib/cache";

export const getSystemSettings = async () => {
  const existing = await db
    .select()
    .from(table.systemSettings)
    .where(eq(table.systemSettings.id, 1))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newSettings] = await db
    .insert(table.systemSettings)
    .values({ id: 1 }) // Force ID to 1
    .returning();

  return newSettings;
};

export const getCachedSettings = async () => {
  // try redis cache first
  const cached =
    await getCachedSystemSettings<
      Awaited<ReturnType<typeof getSystemSettings>>
    >();
  if (cached) {
    return cached;
  }

  // fetch from DB and cache
  const settings = await getSystemSettings();
  await setCachedSystemSettings(settings);

  return settings;
};

export const updateSystemSettings = async (updates: {
  allowSignup?: boolean;
  allowGuestLogin?: boolean;
  maintenanceMode?: boolean;
  guestPostLimit?: number;
}) => {
  const [updated] = await db
    .update(table.systemSettings)
    .set({
      ...updates,
    })
    .where(eq(table.systemSettings.id, 1))
    .returning();

  // invalidate redis cache
  await invalidateSystemSettingsCache();

  return updated;
};
