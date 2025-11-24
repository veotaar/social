import db from "@api/db/db";
import { table } from "@api/db/model";
import { eq } from "drizzle-orm";

let lastFetched = 0;
let cachedSettings: Awaited<ReturnType<typeof getSystemSettings>> | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const now = Date.now();

  if (!cachedSettings || now - lastFetched > CACHE_DURATION) {
    cachedSettings = await getSystemSettings();
    lastFetched = now;
  }

  return cachedSettings;
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

  // Invalidate cache
  cachedSettings = null;
  lastFetched = 0;

  return updated;
};
