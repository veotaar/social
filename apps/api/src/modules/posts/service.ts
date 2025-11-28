import db from "@api/db/db";
import { table } from "@api/db/model";
import {
  block,
  postLike,
  post,
  user,
  bookmark,
  follow,
  postImage,
} from "@api/db/schema";
import {
  and,
  desc,
  eq,
  isNull,
  lt,
  notInArray,
  sql,
  inArray,
  asc,
} from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { getBlockedUserIds } from "@api/modules/block/service";
import { invalidateUserProfileCache } from "@api/lib/cache";
import { broadcastNewPost } from "@api/lib/ws";

type PostImage = InferSelectModel<typeof postImage>;

export const attachImagesToFeed = async <T extends { post: { id: string } }>(
  feed: T[],
): Promise<(T & { post: T["post"] & { images: PostImage[] } })[]> => {
  if (feed.length === 0)
    return feed as (T & { post: T["post"] & { images: PostImage[] } })[];

  const postIds = feed.map((p) => p.post.id);

  // using drizzle's query API to fetch images with the relation
  const postsWithImages = await db.query.post.findMany({
    where: inArray(post.id, postIds),
    columns: { id: true },
    with: {
      images: {
        where: isNull(postImage.deletedAt),
        orderBy: asc(postImage.order),
      },
    },
  });

  const imagesByPostId = Object.fromEntries(
    postsWithImages.map((p) => [p.id, p.images]),
  ) as Record<string, PostImage[]>;

  // add an images field to each post in the feed
  return feed.map((p) => ({
    ...p,
    post: {
      ...p.post,
      images: imagesByPostId[p.post.id] || [],
    },
  }));
};

export const createPost = async ({
  userId,
  content,
  imageIds,
}: { userId: string; content: string; imageIds?: string[] }) => {
  const [created] = await db
    .insert(table.post)
    .values({
      authorId: userId,
      content: content,
    })
    .returning();

  // link images to the post if any were uploaded
  if (imageIds && imageIds.length > 0) {
    await db
      .update(table.postImage)
      .set({ postId: created.id })
      .where(inArray(table.postImage.id, imageIds));
  }

  await db
    .update(table.user)
    .set({ postsCount: sql`${table.user.postsCount} + 1` })
    .where(eq(table.user.id, userId));

  // invalidate user profile cache (postsCount changed)
  await invalidateUserProfileCache(userId);

  // broadcast new post event
  broadcastNewPost(userId, created.id);

  return created;
};

export const INITIAL_CURSOR = "initial";

export const getFeedPosts = async ({
  currentUserId,
  limit = 10,
  cursor,
}: {
  currentUserId: string;
  limit?: number;
  cursor: string;
}) => {
  // use cached block list instead of subqueries
  const blockedUserIds = await getBlockedUserIds(currentUserId);
  const blockedArray = Array.from(blockedUserIds);

  const applyCursor = cursor !== INITIAL_CURSOR;

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

  const postsWithImages = await attachImagesToFeed(feed);

  return {
    posts: postsWithImages,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

export const getPost = async ({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId: string;
}) => {
  // use cached block list instead of subqueries
  const blockedUserIds = await getBlockedUserIds(currentUserId);
  const blockedArray = Array.from(blockedUserIds);

  const result = await db
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
        name: user.name,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
      },
    })
    .from(post)
    .where(
      and(
        eq(post.id, postId),
        blockedArray.length > 0
          ? notInArray(post.authorId, blockedArray)
          : undefined,
        isNull(post.deletedAt),
      ),
    )
    .leftJoin(user, eq(post.authorId, user.id))
    .leftJoin(
      postLike,
      and(eq(postLike.postId, post.id), eq(postLike.userId, currentUserId)),
    )
    .leftJoin(
      bookmark,
      and(eq(bookmark.postId, post.id), eq(bookmark.userId, currentUserId)),
    );

  if (result.length === 0) {
    return null;
  }

  const postWithImages = await db.query.post.findFirst({
    where: eq(post.id, postId),
    columns: { id: true },
    with: {
      images: {
        where: isNull(postImage.deletedAt),
        orderBy: asc(postImage.order),
      },
    },
  });

  return {
    ...result[0],
    post: {
      ...result[0].post,
      images: (postWithImages?.images || []) as PostImage[],
    },
  };
};

export const deletePost = async ({
  postId,
  userId,
}: { postId: string; userId: string }) => {
  // check if the post exists and belongs to the user
  const existingPost = await db
    .select()
    .from(post)
    .where(
      and(
        eq(post.id, postId),
        eq(post.authorId, userId),
        isNull(post.deletedAt),
      ),
    );

  if (existingPost.length === 0) {
    return null;
  }

  const [deleted] = await db
    .update(post)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(post.id, postId), eq(post.authorId, userId)))
    .returning();

  await db
    .update(table.user)
    .set({ postsCount: sql`${table.user.postsCount} - 1` })
    .where(eq(table.user.id, userId));

  // invalidate user profile cache (postsCount changed)
  await invalidateUserProfileCache(userId);

  return deleted;
};

export const updatePost = async ({
  postId,
  content,
  userId,
}: { postId: string; content: string; userId: string }) => {
  // check if the post exists and belongs to the user
  const existingPost = await db
    .select()
    .from(post)
    .where(
      and(
        eq(post.id, postId),
        eq(post.authorId, userId),
        isNull(post.deletedAt),
      ),
    );

  if (existingPost.length === 0) {
    return null;
  }

  const [updated] = await db
    .update(post)
    .set({
      content,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(post.id, postId))
    .returning();

  return updated;
};

export const getFollowingFeedPosts = async ({
  currentUserId,
  limit = 10,
  cursor,
}: {
  currentUserId: string;
  limit?: number;
  cursor: string;
}) => {
  // use cached block list instead of subqueries
  const blockedUserIds = await getBlockedUserIds(currentUserId);
  const blockedArray = Array.from(blockedUserIds);

  const applyCursor = cursor !== INITIAL_CURSOR;

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
    .innerJoin(follow, eq(follow.followeeId, post.authorId))
    .where(
      and(
        eq(follow.followerId, currentUserId),
        blockedArray.length > 0
          ? notInArray(post.authorId, blockedArray)
          : undefined,
        isNull(post.deletedAt),
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

  const postsWithImages = await attachImagesToFeed(feed);

  return {
    posts: postsWithImages,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};
