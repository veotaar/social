import { table } from "@api/db/model";
import db from "@api/db/db";
import { sql, eq, and } from "drizzle-orm";

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
