import db from "@api/db/db";
import { table } from "@api/db/model";
import { and, eq, sql, inArray, lt, desc } from "drizzle-orm";
import { NotFoundError } from "elysia";

export const getBlockedUsers = async ({
  currentUserId,
  limit = 10,
  cursor,
}: { currentUserId: string; limit?: number; cursor: string }) => {
  const applyCursor = cursor !== "initial";

  const blockedUsers = await db
    .select({
      id: table.user.id,
      name: table.user.name,
      username: table.user.username,
      displayUsername: table.user.displayUsername,
      image: table.user.image,
      blockedAt: table.block.createdAt,
      blockId: table.block.id,
    })
    .from(table.user)
    .where(
      and(
        eq(table.block.blockerId, currentUserId),
        applyCursor ? lt(table.block.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(table.block.id))
    .limit(limit + 1)
    .innerJoin(table.block, eq(table.user.id, table.block.blockedId));

  let hasMore = false;
  let nextCursor: string | null = null;

  if (blockedUsers.length > limit) {
    hasMore = true;
    blockedUsers.pop();
  }

  if (blockedUsers.length > 0) {
    const lastBlockInList = blockedUsers[blockedUsers.length - 1];
    if (lastBlockInList) {
      nextCursor = hasMore ? lastBlockInList.blockId : null;
    }
  }

  return {
    blockedUsers,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};
