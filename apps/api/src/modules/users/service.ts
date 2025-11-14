import db from "@api/db/db";
import { table } from "@api/db/model";
import { block, like, post, user } from "@api/db/schema";
import { and, or, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { auth } from "@api/lib/auth";

class ConflictError extends Error {
  status = 409;

  constructor(public message: string) {
    super(message);
  }
}

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

export const editUserProfile = async ({
  targetUserId,
  currentUserId,
  name,
  username,
  displayUsername,
  bio,
  image,
}: {
  targetUserId: string;
  currentUserId: string;
  name?: string;
  username?: string;
  displayUsername?: string;
  bio?: string;
  image?: string | null;
}) => {
  if (targetUserId !== currentUserId) return null;

  const [userSnapshot] = await db
    .select()
    .from(table.user)
    .where(eq(table.user.id, currentUserId));

  if (!userSnapshot) return null;

  if (username && username !== userSnapshot.username) {
    const { available } = await auth.api.isUsernameAvailable({
      body: {
        username,
      },
    });

    if (!available) throw new ConflictError("Username is already taken");
  }

  const [user] = await db
    .update(table.user)
    .set({
      name: name ?? userSnapshot.name,
      username: username ?? userSnapshot.username,
      displayUsername: displayUsername ?? userSnapshot.displayUsername,
      bio: bio ?? userSnapshot.bio,
      image: image !== undefined ? image : userSnapshot.image,
    })
    .where(eq(table.user.id, currentUserId))
    .returning();

  return user;
};

export const createFollowRequest = async ({
  currentUserId,
  followerId,
  followeeId,
}: {
  currentUserId: string;
  followerId: string;
  followeeId: string;
}) => {
  if (currentUserId !== followerId) return null;

  const [existingRequest] = await db
    .select()
    .from(table.followRequest)
    .where(
      and(
        eq(table.followRequest.followerId, followerId),
        eq(table.followRequest.followeeId, followeeId),
        eq(table.followRequest.status, "pending"),
      ),
    );

  if (existingRequest) {
    throw new ConflictError("Follow request already exists");
  }

  const [followRequest] = await db
    .insert(table.followRequest)
    .values({
      followerId,
      followeeId,
    })
    .returning();

  return followRequest;
};
