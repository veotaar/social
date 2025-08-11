import { table } from "@api/db/model";
import db from "@api/db/db";
import { eq, and, isNull, desc, notInArray, lt, sql } from "drizzle-orm";
import { comment, post, block, user } from "@api/db/schema";

export const createComment = async ({
  userId,
  postId,
  content,
  parentCommentId,
  imageUrl,
}: {
  userId: string;
  postId: string;
  content: string;
  parentCommentId?: string | null;
  imageUrl?: string | null;
}) => {
  const postExists = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.id, postId), isNull(post.deletedAt)));
  if (postExists.length === 0) return null;

  const [created] = await db
    .insert(table.comment)
    .values({
      authorId: userId,
      postId,
      content,
      parentCommentId,
      imageUrl,
    })
    .returning();

  // increment commentsCount on post
  await db
    .update(table.post)
    .set({ commentsCount: sql`${post.commentsCount} + 1` })
    .where(eq(post.id, postId));

  return created;
};

export const deleteComment = async ({
  commentId,
  userId,
}: {
  commentId: string;
  userId: string;
}) => {
  const [existing] = await db
    .select({ id: comment.id, postId: comment.postId })
    .from(comment)
    .where(
      and(
        eq(comment.id, commentId),
        eq(comment.authorId, userId),
        isNull(comment.deletedAt),
      ),
    );
  if (!existing) return null;

  await db
    .update(table.comment)
    .set({ deletedAt: new Date() })
    .where(eq(comment.id, commentId));

  // decrease commentsCount on post
  await db
    .update(table.post)
    .set({ commentsCount: sql`${post.commentsCount} - 1` })
    .where(and(eq(post.id, existing.postId), sql`${post.commentsCount} > 0`));

  return true;
};

export const updateComment = async ({
  commentId,
  userId,
  content,
  imageUrl,
}: {
  commentId: string;
  userId: string;
  content?: string;
  imageUrl?: string | null;
}) => {
  const [existing] = await db
    .select({ id: comment.id })
    .from(comment)
    .where(
      and(
        eq(comment.id, commentId),
        eq(comment.authorId, userId),
        isNull(comment.deletedAt),
      ),
    );
  if (!existing) return null;

  const [updated] = await db
    .update(table.comment)
    .set({
      ...(content !== undefined ? { content } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(comment.id, commentId))
    .returning();

  return updated;
};

export const getPostComments = async ({
  postId,
  currentUserId,
  limit = 10,
  cursor,
}: {
  postId: string;
  currentUserId: string;
  limit?: number;
  cursor?: string;
}) => {
  const blockedUsersSubQuery = db
    .select({ id: block.blockedId })
    .from(block)
    .where(eq(block.blockerId, currentUserId));

  const blockingUsersSubQuery = db
    .select({ id: block.blockerId })
    .from(block)
    .where(eq(block.blockedId, currentUserId));

  const rows = await db
    .select({
      comment: {
        id: comment.id,
        content: comment.content,
        imageUrl: comment.imageUrl,
        createdAt: comment.createdAt,
        likesCount: comment.likesCount,
        repliesCount: comment.repliesCount,
      },
      author: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
      },
    })
    .from(comment)
    .where(
      and(
        eq(comment.postId, postId),
        isNull(comment.deletedAt),
        notInArray(comment.authorId, blockedUsersSubQuery),
        notInArray(comment.authorId, blockingUsersSubQuery),
        cursor ? lt(comment.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(comment.id))
    .leftJoin(user, eq(comment.authorId, user.id))
    .limit(limit + 1);

  let hasMore = false;
  let nextCursor: string | null = null;

  if (rows.length > limit) {
    hasMore = true;
    rows.pop();
  }

  if (rows.length > 0) {
    const last = rows[rows.length - 1]?.comment;
    if (last) nextCursor = last.id;
  }

  return {
    comments: rows,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};
