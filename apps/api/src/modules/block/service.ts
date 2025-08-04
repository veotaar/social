import { table } from "@api/db/model";
import db from "@api/db/db";
import { and, eq } from "drizzle-orm";

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

  return deleted;
};
