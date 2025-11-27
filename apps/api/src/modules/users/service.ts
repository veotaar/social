import db from "@api/db/db";
import { table } from "@api/db/model";
import { block, post, postLike, user, follow, bookmark } from "@api/db/schema";
import { and, or, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { auth } from "@api/lib/auth";
import { NotFoundError } from "elysia";
import { ConflictError, ForbiddenError } from "@api/lib/error";
import {
  createNotification,
  removeNotification,
} from "@api/modules/users/notifications/service";
import { attachImagesToFeed } from "../posts/service";
import { getBlockedUserIds } from "@api/modules/block/service";
import {
  getCachedUserProfile,
  setCachedUserProfile,
  invalidateUserProfileCache,
} from "@api/lib/cache";

// base user profile type (without relationship fields)
type BaseUserProfile = {
  id: string;
  username: string | null;
  displayUsername: string | null;
  name: string;
  image: string | null;
  bio: string | null;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  commentsCount: number | null;
  createdAt: string;
  banned: boolean | null;
};

// get base user profile from cache or DB (without relationship fields)
const getBaseUserProfile = async (
  userId: string,
): Promise<BaseUserProfile | null> => {
  // try cache first
  const cached = await getCachedUserProfile<BaseUserProfile>(userId);
  if (cached) {
    return cached;
  }

  // fetch from DB
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
    .where(eq(user.id, userId));

  if (!foundUser) return null;

  // Cache the base profile
  await setCachedUserProfile(userId, foundUser);

  return foundUser;
};

// get relationship fields between current user and target user
const getUserRelationships = async (
  currentUserId: string,
  targetUserId: string,
): Promise<{
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
}> => {
  // check if either user has blocked the other
  const [followingRecord, followedByRecord, blockRecord, blockedByRecord] =
    await Promise.all([
      db
        .select({ id: follow.id })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, currentUserId),
            eq(follow.followeeId, targetUserId),
          ),
        )
        .limit(1),
      db
        .select({ id: follow.id })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, targetUserId),
            eq(follow.followeeId, currentUserId),
          ),
        )
        .limit(1),
      db
        .select({ id: block.id })
        .from(block)
        .where(
          and(
            eq(block.blockerId, currentUserId),
            eq(block.blockedId, targetUserId),
          ),
        )
        .limit(1),
      db
        .select({ id: block.id })
        .from(block)
        .where(
          and(
            eq(block.blockerId, targetUserId),
            eq(block.blockedId, currentUserId),
          ),
        )
        .limit(1),
    ]);

  return {
    isFollowing: followingRecord.length > 0,
    isFollowedBy: followedByRecord.length > 0,
    isBlocked: blockRecord.length > 0,
    isBlockedBy: blockedByRecord.length > 0,
  };
};

export const getUserById = async ({
  id,
  currentUserId,
}: { id: string; currentUserId: string }) => {
  // get relationships first to check for blocks
  const relationships = await getUserRelationships(currentUserId, id);

  // if target user has blocked current user, return null
  if (relationships.isBlockedBy) {
    return null;
  }

  // get base profile
  const baseProfile = await getBaseUserProfile(id);
  if (!baseProfile) return null;

  // combine base profile with relationship fields
  return {
    ...baseProfile,
    isFollowing: relationships.isFollowing,
    isFollowedBy: relationships.isFollowedBy,
    isBlocked: relationships.isBlocked,
  };
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

  const [updatedUser] = await db
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

  await invalidateUserProfileCache(currentUserId);

  return updatedUser;
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
        type: "follow_accepted",
      });

      await removeNotification({
        senderId: followRequest.followerId,
        recipientId: followRequest.followeeId,
        followRequestId: followRequest.id,
        type: "follow_request",
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

  // invalidate user profile cache for both users when follow is accepted
  if (newStatus === "accepted") {
    await Promise.all([
      invalidateUserProfileCache(followRequest.followerId),
      invalidateUserProfileCache(followRequest.followeeId),
    ]);
  }

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
      requester: {
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
      requester: {
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

export const getPostsByUser = async ({
  userId,
  currentUserId,
  cursor,
  limit = 10,
}: {
  userId: string;
  currentUserId: string;
  cursor: string;
  limit?: number;
}) => {
  const blockedUserIds = await getBlockedUserIds(currentUserId);
  const blockedArray = Array.from(blockedUserIds);

  const applyCursor = cursor !== "initial";

  const feed = await db
    .select({
      post: {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        likedByCurrentUser: sql<boolean>`CASE WHEN ${postLike.id} IS NOT NULL THEN true ELSE false END`,
        isBookmarked: sql<boolean>`CASE WHEN ${bookmark.id} IS NOT NULL THEN true ELSE false END`,
      },
      author: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        name: user.name,
        image: user.image,
      },
    })
    .from(post)
    .where(
      and(
        blockedArray.length > 0
          ? notInArray(post.authorId, blockedArray)
          : undefined,
        isNull(post.deletedAt),
        eq(post.authorId, userId),
        applyCursor ? lt(post.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(post.id))
    .limit(limit + 1)
    .leftJoin(user, eq(post.authorId, user.id))
    .leftJoin(
      postLike,
      and(eq(postLike.postId, post.id), eq(postLike.userId, currentUserId)),
    )
    .leftJoin(
      bookmark,
      and(eq(bookmark.postId, post.id), eq(bookmark.userId, currentUserId)),
    );

  let hasMore = false;
  let nextCursor: string | null = null;

  if (feed.length > limit) {
    hasMore = true;
    feed.pop();
  }

  if (feed.length > 0) {
    const lastPostInFeed = feed[feed.length - 1]?.post;
    if (lastPostInFeed) {
      nextCursor = lastPostInFeed.id;
    }
  }

  // Attach images to posts
  const feedWithImages = await attachImagesToFeed(feed);

  return {
    posts: feedWithImages,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};
