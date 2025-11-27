import { table } from "@api/db/model";
import db from "@api/db/db";
import { and, eq } from "drizzle-orm";
import {
  addToBlockListCache,
  removeFromBlockListCache,
  getCachedBlockList,
  getCachedBlockedByList,
  setCachedBlockList,
  setCachedBlockedByList,
} from "@api/lib/cache";

export const blockUser = async ({
  blockerId,
  blockedId,
}: { blockerId: string; blockedId: string }) => {
  const [blockRecord] = await db
    .insert(table.block)
    .values({
      blockerId,
      blockedId,
    })
    .returning();

  await addToBlockListCache(blockerId, blockedId);

  return blockRecord;
};

export const unblockUser = async ({
  blockerId,
  blockedId,
}: { blockerId: string; blockedId: string }) => {
  const [deleted] = await db
    .delete(table.block)
    .where(
      and(
        eq(table.block.blockerId, blockerId),
        eq(table.block.blockedId, blockedId),
      ),
    )
    .returning();

  await removeFromBlockListCache(blockerId, blockedId);

  return deleted;
};

export const getBlockList = async (userId: string): Promise<string[]> => {
  // try cache first
  const cached = await getCachedBlockList(userId);
  if (cached !== null) {
    return Array.from(cached);
  }

  // otherwise fetch from DB
  const blocks = await db
    .select({ blockedId: table.block.blockedId })
    .from(table.block)
    .where(eq(table.block.blockerId, userId));

  const blockedIds = blocks.map((b) => b.blockedId);

  // cache the result
  await setCachedBlockList(userId, blockedIds);

  return blockedIds;
};

export const getBlockedByList = async (userId: string): Promise<string[]> => {
  // try cache first
  const cached = await getCachedBlockedByList(userId);
  if (cached !== null) {
    return Array.from(cached);
  }

  // otherwise fetch from DB
  const blocks = await db
    .select({ blockerId: table.block.blockerId })
    .from(table.block)
    .where(eq(table.block.blockedId, userId));

  const blockerIds = blocks.map((b) => b.blockerId);

  // cache the result
  await setCachedBlockedByList(userId, blockerIds);

  return blockerIds;
};

export const getBlockedUserIds = async (
  userId: string,
): Promise<Set<string>> => {
  const [blocked, blockedBy] = await Promise.all([
    getBlockList(userId),
    getBlockedByList(userId),
  ]);

  return new Set([...blocked, ...blockedBy]);
};
