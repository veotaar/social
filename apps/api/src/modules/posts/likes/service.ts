import db from "@api/db/db";
import { table } from "@api/db/model";
import { and, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";

export const getPostLikes = async ({
  userId,
  postId,
  limit = 10,
  cursor,
}: { userId: string; postId: string; limit?: number; cursor: string }) => {
  const blockedUsersSubQuery = db
    .select({ id: table.block.blockedId })
    .from(table.block)
    .where(eq(table.block.blockerId, userId));

  const blockingUsersSubQuery = db
    .select({ id: table.block.blockerId })
    .from(table.block)
    .where(eq(table.block.blockedId, userId));

  const applyCursor = cursor !== "initial";

  const likedBy = await db
    .select({
      id: table.like.id,
      userId: table.user.id,
      username: table.user.username,
      name: table.user.name,
      image: table.user.image,
    })
    .from(table.like)
    .where(
      and(
        notInArray(table.like.userId, blockedUsersSubQuery),
        notInArray(table.like.userId, blockingUsersSubQuery),
        eq(table.like.postId, postId),
        applyCursor ? lt(table.like.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(table.like.id))
    .limit(limit + 1)
    .leftJoin(table.user, eq(table.user.id, table.like.userId));

  let hasMore = false;
  let nextCursor: string | null = null;

  if (likedBy.length > limit) {
    hasMore = true;
    likedBy.pop();
  }

  if (likedBy.length > 0) {
    const lastLike = likedBy[likedBy.length - 1];
    if (lastLike) {
      nextCursor = lastLike.id;
    }
  }

  return {
    likes: likedBy,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};

export const likePost = async ({
  userId,
  postId,
}: { userId: string; postId: string }) => {
  const existingLike = await db
    .select({ id: table.like.id })
    .from(table.like)
    .where(and(eq(table.like.userId, userId), eq(table.like.postId, postId)));

  if (existingLike.length > 0) {
    return null;
  }

  const [likeRecord] = await db
    .insert(table.like)
    .values({
      userId,
      postId,
    })
    .returning();

  await db
    .update(table.post)
    .set({ likesCount: sql`${table.post.likesCount} + 1` })
    .where(eq(table.post.id, postId));

  return likeRecord;
};

export const unlikePost = async ({
  userId,
  postId,
}: { userId: string; postId: string }) => {
  const existingLike = await db
    .select({ id: table.like.id })
    .from(table.like)
    .where(and(eq(table.like.userId, userId), eq(table.like.postId, postId)));

  if (existingLike.length === 0) {
    return null;
  }

  const [deleted] = await db
    .delete(table.like)
    .where(and(eq(table.like.userId, userId), eq(table.like.postId, postId)))
    .returning();

  if (deleted) {
    await db
      .update(table.post)
      .set({ likesCount: sql`${table.post.likesCount} - 1` })
      .where(and(eq(table.post.id, postId), sql`${table.post.likesCount} > 0`));
  }

  return deleted;
};

export const likeComment = async ({
  userId,
  commentId,
}: { userId: string; commentId: string }) => {
  const existingLike = await db
    .select({ id: table.like.id })
    .from(table.like)
    .where(
      and(eq(table.like.userId, userId), eq(table.like.commentId, commentId)),
    );

  if (existingLike.length > 0) {
    return null;
  }

  const [likeRecord] = await db
    .insert(table.like)
    .values({
      userId,
      commentId,
    })
    .returning();

  await db
    .update(table.comment)
    .set({ likesCount: sql`${table.comment.likesCount} + 1` })
    .where(eq(table.comment.id, commentId));

  return likeRecord;
};

export const unlikeComment = async ({
  userId,
  commentId,
}: { userId: string; commentId: string }) => {
  const existingLike = await db
    .select({ id: table.like.id })
    .from(table.like)
    .where(
      and(eq(table.like.userId, userId), eq(table.like.commentId, commentId)),
    );

  if (existingLike.length === 0) {
    return null;
  }

  const [deleted] = await db
    .delete(table.like)
    .where(
      and(eq(table.like.userId, userId), eq(table.like.commentId, commentId)),
    )
    .returning();

  if (deleted) {
    await db
      .update(table.comment)
      .set({ likesCount: sql`${table.comment.likesCount} - 1` })
      .where(
        and(
          eq(table.comment.id, commentId),
          sql`${table.comment.likesCount} > 0`,
        ),
      );
  }

  return deleted;
};
