import { table } from "@/db/model";
import db from "@/db/db";
import { and, desc, eq, notInArray, lt } from "drizzle-orm";
import { block, post, user } from "@/db/schema";

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
