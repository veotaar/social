import db from "@api/db/db";
import { table } from "@api/db/model";
import { and, eq, sql, inArray } from "drizzle-orm";
import { NotFoundError } from "elysia";

export const unFollowUser = async ({
  currentUserId,
  targetUserId,
}: { currentUserId: string; targetUserId: string }) => {
  const [followRecord] = await db
    .select()
    .from(table.follow)
    .where(
      and(
        eq(table.follow.followerId, currentUserId),
        eq(table.follow.followeeId, targetUserId),
      ),
    );

  if (!followRecord) {
    throw new NotFoundError("Follow relationship not found");
  }

  await db.transaction(async (tx) => {
    await tx.delete(table.follow).where(eq(table.follow.id, followRecord.id));

    await tx
      .update(table.user)
      .set({
        followersCount: sql`${table.user.followersCount} - 1`,
      })
      .where(eq(table.user.id, targetUserId));

    await tx
      .update(table.user)
      .set({
        followingCount: sql`${table.user.followingCount} - 1`,
      })
      .where(eq(table.user.id, currentUserId));
  });
};

export const removeFollower = async ({
  currentUserId,
  targetUserId,
}: { currentUserId: string; targetUserId: string }) => {
  const [followRecord] = await db
    .select()
    .from(table.follow)
    .where(
      and(
        eq(table.follow.followerId, targetUserId),
        eq(table.follow.followeeId, currentUserId),
      ),
    );

  if (!followRecord) {
    throw new NotFoundError("Follow relationship not found");
  }

  await db.transaction(async (tx) => {
    await tx.delete(table.follow).where(eq(table.follow.id, followRecord.id));

    await tx
      .update(table.user)
      .set({
        followersCount: sql`${table.user.followersCount} - 1`,
      })
      .where(eq(table.user.id, currentUserId));

    await tx
      .update(table.user)
      .set({
        followingCount: sql`${table.user.followingCount} - 1`,
      })
      .where(eq(table.user.id, targetUserId));
  });
};

export const removeFollowerMutually = async ({
  currentUserId,
  targetUserId,
}: { currentUserId: string; targetUserId: string }) => {
  await Promise.all([
    removeFollower({ currentUserId, targetUserId }),
    unFollowUser({ currentUserId, targetUserId }),
  ]);
};

export const listFollowers = async ({
  userId,
}: {
  userId: string;
}) => {
  const followers = await db
    .select({
      userid: table.user.id,
      name: table.user.name,
      username: table.user.username,
      displayUsername: table.user.displayUsername,
      image: table.user.image,
    })
    .from(table.follow)
    .where(eq(table.follow.followeeId, userId))
    .innerJoin(table.user, eq(table.user.id, table.follow.followerId));

  return followers;
};

export const listFollowing = async ({
  userId,
}: {
  userId: string;
}) => {
  const following = await db
    .select({
      userid: table.user.id,
      name: table.user.name,
      username: table.user.username,
      displayUsername: table.user.displayUsername,
      image: table.user.image,
    })
    .from(table.follow)
    .where(eq(table.follow.followerId, userId))
    .innerJoin(table.user, eq(table.user.id, table.follow.followeeId));

  return following;
};

export const listMutualFollowers = async ({
  userId,
}: {
  userId: string;
}) => {
  const mutualFollowers = await db
    .select({
      userid: table.user.id,
      name: table.user.name,
      username: table.user.username,
      displayUsername: table.user.displayUsername,
      image: table.user.image,
    })
    .from(table.follow)
    .where(
      and(
        eq(table.follow.followerId, userId),
        inArray(
          table.follow.followeeId,
          db
            .select({
              followeeId: table.follow.followeeId,
            })
            .from(table.follow)
            .where(eq(table.follow.followerId, userId)),
        ),
      ),
    )
    .innerJoin(table.user, eq(table.user.id, table.follow.followeeId));

  return mutualFollowers;
};
