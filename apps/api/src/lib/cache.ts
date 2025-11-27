import { redis } from "bun";

// Cache key prefixes
export const CACHE_KEYS = {
  BLOCK_LIST: "blocks:",
  BLOCKED_BY: "blockedby:",
  USER_PROFILE: "user:",
  SYSTEM_SETTINGS: "settings:system",
  NOTIFICATION_COUNT: "notifications:unread:",
} as const;

export const CACHE_TTL = {
  BLOCK_LIST: 60 * 5, // 5m
  USER_PROFILE: 60 * 2, // 2m
  SYSTEM_SETTINGS: 60 * 5, // 5m
  NOTIFICATION_COUNT: 60 * 5, // 5m
} as const;

// ============= Block List Cache =============
export const getCachedBlockList = async (
  userId: string,
): Promise<Set<string> | null> => {
  const key = `${CACHE_KEYS.BLOCK_LIST}${userId}`;
  const members = await redis.smembers(key);
  if (!members || members.length === 0) {
    // Check if key exists but is empty vs not existing
    const exists = await redis.exists(key);
    if (!exists) return null;
    return new Set();
  }
  return new Set(members);
};

// users who have blocked this user
export const getCachedBlockedByList = async (
  userId: string,
): Promise<Set<string> | null> => {
  const key = `${CACHE_KEYS.BLOCKED_BY}${userId}`;
  const members = await redis.smembers(key);
  if (!members || members.length === 0) {
    const exists = await redis.exists(key);
    if (!exists) return null;
    return new Set();
  }
  return new Set(members);
};

export const setCachedBlockList = async (
  userId: string,
  blockedIds: string[],
): Promise<void> => {
  const key = `${CACHE_KEYS.BLOCK_LIST}${userId}`;
  // Delete existing and set new
  await redis.del(key);
  if (blockedIds.length > 0) {
    await redis.sadd(key, ...blockedIds);
  } else {
    // Set empty marker so we know it's cached but empty
    await redis.set(`${key}:empty`, "1", "EX", CACHE_TTL.BLOCK_LIST);
  }
  await redis.expire(key, CACHE_TTL.BLOCK_LIST);
};

export const setCachedBlockedByList = async (
  userId: string,
  blockerIds: string[],
): Promise<void> => {
  const key = `${CACHE_KEYS.BLOCKED_BY}${userId}`;
  await redis.del(key);
  if (blockerIds.length > 0) {
    await redis.sadd(key, ...blockerIds);
  }
  await redis.expire(key, CACHE_TTL.BLOCK_LIST);
};

export const addToBlockListCache = async (
  blockerId: string,
  blockedId: string,
): Promise<void> => {
  const blockerKey = `${CACHE_KEYS.BLOCK_LIST}${blockerId}`;
  const blockedByKey = `${CACHE_KEYS.BLOCKED_BY}${blockedId}`;

  // Only add if the cache key exists
  const [blockerExists, blockedByExists] = await Promise.all([
    redis.exists(blockerKey),
    redis.exists(blockedByKey),
  ]);

  if (blockerExists) {
    await redis.sadd(blockerKey, blockedId);
  }
  if (blockedByExists) {
    await redis.sadd(blockedByKey, blockerId);
  }
};

export const removeFromBlockListCache = async (
  blockerId: string,
  blockedId: string,
): Promise<void> => {
  const blockerKey = `${CACHE_KEYS.BLOCK_LIST}${blockerId}`;
  const blockedByKey = `${CACHE_KEYS.BLOCKED_BY}${blockedId}`;

  await Promise.all([
    redis.srem(blockerKey, blockedId),
    redis.srem(blockedByKey, blockerId),
  ]);
};

export const isUserBlocked = async (
  currentUserId: string,
  targetUserId: string,
): Promise<{ blocked: boolean; blockedBy: boolean } | null> => {
  const [blockList, blockedByList] = await Promise.all([
    getCachedBlockList(currentUserId),
    getCachedBlockedByList(currentUserId),
  ]);

  // if either cache miss, return null to indicate DB lookup needed
  if (blockList === null || blockedByList === null) {
    return null;
  }

  return {
    blocked: blockList.has(targetUserId),
    blockedBy: blockedByList.has(targetUserId),
  };
};

export const invalidateBlockListCache = async (
  userId: string,
): Promise<void> => {
  await Promise.all([
    redis.del(`${CACHE_KEYS.BLOCK_LIST}${userId}`),
    redis.del(`${CACHE_KEYS.BLOCKED_BY}${userId}`),
    redis.del(`${CACHE_KEYS.BLOCK_LIST}${userId}:empty`),
  ]);
};

// ============= User Profile =============
export const getCachedUserProfile = async <T>(
  userId: string,
): Promise<T | null> => {
  const key = `${CACHE_KEYS.USER_PROFILE}${userId}`;
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
};

export const setCachedUserProfile = async <T>(
  userId: string,
  profile: T,
): Promise<void> => {
  const key = `${CACHE_KEYS.USER_PROFILE}${userId}`;
  await redis.set(key, JSON.stringify(profile), "EX", CACHE_TTL.USER_PROFILE);
};

export const invalidateUserProfileCache = async (
  userId: string,
): Promise<void> => {
  await redis.del(`${CACHE_KEYS.USER_PROFILE}${userId}`);
};

// ============= System Settings  =============
export const getCachedSystemSettings = async <T>(): Promise<T | null> => {
  const data = await redis.get(CACHE_KEYS.SYSTEM_SETTINGS);
  if (!data) return null;
  return JSON.parse(data) as T;
};

export const setCachedSystemSettings = async <T>(
  settings: T,
): Promise<void> => {
  await redis.set(
    CACHE_KEYS.SYSTEM_SETTINGS,
    JSON.stringify(settings),
    "EX",
    CACHE_TTL.SYSTEM_SETTINGS,
  );
};

export const invalidateSystemSettingsCache = async (): Promise<void> => {
  await redis.del(CACHE_KEYS.SYSTEM_SETTINGS);
};

// ============= Notification Count  =============
export const getCachedNotificationCount = async (
  userId: string,
): Promise<number | null> => {
  const key = `${CACHE_KEYS.NOTIFICATION_COUNT}${userId}`;
  const count = await redis.get(key);
  if (count === null) return null;
  return Number.parseInt(count, 10);
};

export const setCachedNotificationCount = async (
  userId: string,
  count: number,
): Promise<void> => {
  const key = `${CACHE_KEYS.NOTIFICATION_COUNT}${userId}`;
  await redis.set(key, count.toString(), "EX", CACHE_TTL.NOTIFICATION_COUNT);
};

export const incrementNotificationCount = async (
  userId: string,
): Promise<void> => {
  const key = `${CACHE_KEYS.NOTIFICATION_COUNT}${userId}`;
  const exists = await redis.exists(key);
  if (exists) {
    await redis.incr(key);
  }
};

export const decrementNotificationCount = async (
  userId: string,
  amount = 1,
): Promise<void> => {
  const key = `${CACHE_KEYS.NOTIFICATION_COUNT}${userId}`;
  const exists = await redis.exists(key);
  if (exists) {
    await redis.decrby(key, amount);
  }
};

export const invalidateNotificationCountCache = async (
  userId: string,
): Promise<void> => {
  await redis.del(`${CACHE_KEYS.NOTIFICATION_COUNT}${userId}`);
};

// ============= Helpers =============
export const getOrSet = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> => {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const data = await fetcher();
  await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  return data;
};

export const invalidateByPattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
