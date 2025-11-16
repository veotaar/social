import db from "@api/db/db";
import { table } from "@api/db/model";
import { block, like, post, user, follow } from "@api/db/schema";
import { and, or, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { auth } from "@api/lib/auth";
import { NotFoundError } from "elysia";
import { ConflictError, ForbiddenError } from "@api/lib/error";
import {
  createNotification,
  removeNotification,
} from "@api/modules/users/notifications/service";

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
      isFollowing: sql<boolean>`CASE WHEN ${follow.id} IS NOT NULL THEN true ELSE false END`,
      isFollowedBy: sql<boolean>`CASE WHEN follow_back.id IS NOT NULL THEN true ELSE false END`,
    })
    .from(table.user)
    .leftJoin(
      follow,
      and(eq(follow.followerId, currentUserId), eq(follow.followeeId, user.id)),
    )
    .leftJoin(
      sql`${follow} AS follow_back`,
      and(
        eq(sql`follow_back.follower_id`, user.id),
        eq(sql`follow_back.followee_id`, currentUserId),
      ),
    )
    .where(eq(user.id, id));

  if (!foundUser) return null;

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

  if (!userSnapshot) throw new NotFoundError("User not found");

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

  // check for blocks between users
  const blockRecords = await db
    .select()
    .from(block)
    .where(
      or(
        and(eq(block.blockerId, followerId), eq(block.blockedId, followeeId)),
        and(eq(block.blockerId, followeeId), eq(block.blockedId, followerId)),
      ),
    );

  if (blockRecords.length > 0) {
    throw new ForbiddenError("Cannot send follow request due to block");
  }

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

  await createNotification({
    senderId: followerId,
    recipientId: followeeId,
    followRequestId: followRequest.id,
    type: "follow_request",
  });

  return followRequest;
};

export const updateFollowRequestStatus = async ({
  currentUserId,
  targetUserId,
  followRequestId,
  newStatus,
}: {
  currentUserId: string;
  targetUserId: string;
  followRequestId: string;
  newStatus: "accepted" | "rejected" | "cancelled";
}) => {
  const [followRequest] = await db
    .select()
    .from(table.followRequest)
    .where(eq(table.followRequest.id, followRequestId));

  if (!followRequest) throw new NotFoundError("Follow request not found");
  if (followRequest.status !== "pending") throw new ConflictError("Conflict");
  if (followRequest.followeeId !== targetUserId)
    throw new ForbiddenError("Forbidden");

  if (
    (newStatus === "accepted" || newStatus === "rejected") &&
    followRequest.followeeId !== currentUserId
  ) {
    throw new ForbiddenError(
      "Only the followee can accept or reject the follow request",
    );
  }

  if (newStatus === "cancelled" && followRequest.followerId !== currentUserId) {
    throw new ForbiddenError("Only the follower can cancel the follow request");
  }

  const updatedRequest = await db.transaction(async (tx) => {
    const [updatedRequest] = await tx
      .update(table.followRequest)
      .set({
        status: newStatus,
      })
      .where(eq(table.followRequest.id, followRequestId))
      .returning();

    // If the follow request is accepted, create a follow record
    if (newStatus === "accepted") {
      await tx
        .insert(table.follow)
        .values({
          followerId: followRequest.followerId,
          followeeId: followRequest.followeeId,
        })
        .returning();

      // Update followersCount and followingCount
      await tx
        .update(table.user)
        .set({
          followersCount: sql`${table.user.followersCount} + 1`,
        })
        .where(eq(table.user.id, followRequest.followeeId));

      await tx
        .update(table.user)
        .set({
          followingCount: sql`${table.user.followingCount} + 1`,
        })
        .where(eq(table.user.id, followRequest.followerId));

      // Create notification for accepted follow request
      await createNotification({
        senderId: followRequest.followeeId,
        recipientId: followRequest.followerId,
        followId: followRequest.id,
        type: "follow_accepted",
      });
    }

    if (newStatus === "cancelled") {
      await removeNotification({
        senderId: followRequest.followerId,
        recipientId: followRequest.followeeId,
        followRequestId: followRequest.id,
        type: "follow_request",
      });
    }

    return updatedRequest;
  });

  return updatedRequest;
};

export const getFollowRequests = async ({
  userId,
}: {
  userId: string;
}) => {
  // Get sent follow requests (where user is the follower)
  const sentRequests = await db
    .select({
      id: table.followRequest.id,
      followerId: table.followRequest.followerId,
      followeeId: table.followRequest.followeeId,
      status: table.followRequest.status,
      createdAt: table.followRequest.createdAt,
      updatedAt: table.followRequest.updatedAt,
      followee: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        name: user.name,
        image: user.image,
      },
    })
    .from(table.followRequest)
    .innerJoin(user, eq(table.followRequest.followeeId, user.id))
    .where(
      and(
        eq(table.followRequest.followerId, userId),
        eq(table.followRequest.status, "pending"),
      ),
    )
    .orderBy(desc(table.followRequest.createdAt));

  // Get received follow requests (where user is the followee)
  const receivedRequests = await db
    .select({
      id: table.followRequest.id,
      followerId: table.followRequest.followerId,
      followeeId: table.followRequest.followeeId,
      status: table.followRequest.status,
      createdAt: table.followRequest.createdAt,
      updatedAt: table.followRequest.updatedAt,
      follower: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        name: user.name,
        image: user.image,
      },
    })
    .from(table.followRequest)
    .innerJoin(user, eq(table.followRequest.followerId, user.id))
    .where(
      and(
        eq(table.followRequest.followeeId, userId),
        eq(table.followRequest.status, "pending"),
      ),
    )
    .orderBy(desc(table.followRequest.createdAt));

  return {
    sent: sentRequests,
    received: receivedRequests,
  };
};
