import db from "@api/db/db";
import { table } from "@api/db/model";
import { block, like, post, user } from "@api/db/schema";
import { and, or, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";

export const getUserById = async ({
  id,
  currentUserId,
}: { id: string; currentUserId: string }) => {
  // Check if the target user has blocked the current user
  const blockRecord = await db
    .select()
    .from(block)
    .where(and(eq(block.blockerId, id), eq(block.blockedId, currentUserId)));

  if (blockRecord.length > 0) {
    return null;
  }

  const [foundUser] = await db
    .select({
      id: user.id,
      username: user.username,
      displayUsername: user.displayUsername,
      name: user.name,
      image: user.image,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      commentsCount: user.commentsCount,
      createdAt: user.createdAt,
      banned: user.banned,
    })
    .from(table.user)
    .where(eq(user.id, id));

  return foundUser;
};
