import db from "@api/db/db";
import { table } from "@api/db/model";
import { and, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { getPost } from "../service";
import {
  createNotification,
  removeNotification,
} from "@api/modules/users/notifications/service";

export const getCommentLikes = async ({
  userId,
  commentId,
  limit = 10,
  cursor,
}: { userId: string; commentId: string; limit?: number; cursor: string }) => {
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
      id: table.commentLike.id,
      userId: table.user.id,
      username: table.user.username,
      name: table.user.name,
      image: table.user.image,
    })
    .from(table.commentLike)
    .where(
      and(
        notInArray(table.commentLike.userId, blockedUsersSubQuery),
        notInArray(table.commentLike.userId, blockingUsersSubQuery),
        eq(table.commentLike.commentId, commentId),
        applyCursor ? lt(table.commentLike.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(table.commentLike.id))
    .limit(limit + 1)
    .leftJoin(table.user, eq(table.user.id, table.commentLike.userId));

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
      id: table.postLike.id,
      userId: table.user.id,
      username: table.user.username,
      name: table.user.name,
      image: table.user.image,
    })
    .from(table.postLike)
    .where(
      and(
        notInArray(table.postLike.userId, blockedUsersSubQuery),
        notInArray(table.postLike.userId, blockingUsersSubQuery),
        eq(table.postLike.postId, postId),
        applyCursor ? lt(table.postLike.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(table.postLike.id))
    .limit(limit + 1)
    .leftJoin(table.user, eq(table.user.id, table.postLike.userId));

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
    .select({ id: table.postLike.id })
    .from(table.postLike)
    .where(
      and(eq(table.postLike.userId, userId), eq(table.postLike.postId, postId)),
    );

  if (existingLike.length > 0) {
    return null;
  }

  const [likeRecord] = await db
    .insert(table.postLike)
    .values({
      userId,
      postId,
    })
    .returning();

  await db
    .update(table.post)
    .set({ likesCount: sql`${table.post.likesCount} + 1` })
    .where(eq(table.post.id, postId));

  // const [post] = await db
  //   .select({ likesCount: table.post.likesCount })
  //   .from(table.post)
  //   .where(eq(table.post.id, postId));

  const updatedPost = await getPost({ postId, currentUserId: userId });

  if (updatedPost?.author) {
    await createNotification({
      senderId: userId,
      recipientId: updatedPost.author.id,
      postId: postId,
      type: "post_like",
    });
  }

  return updatedPost;
};

export const unlikePost = async ({
  userId,
  postId,
}: { userId: string; postId: string }) => {
  const existingLike = await db
    .select({ id: table.postLike.id })
    .from(table.postLike)
    .where(
      and(eq(table.postLike.userId, userId), eq(table.postLike.postId, postId)),
    );

  if (existingLike.length === 0) {
    return null;
  }

  const [deleted] = await db
    .delete(table.postLike)
    .where(
      and(eq(table.postLike.userId, userId), eq(table.postLike.postId, postId)),
    )
    .returning();

  if (deleted) {
    await db
      .update(table.post)
      .set({ likesCount: sql`${table.post.likesCount} - 1` })
      .where(and(eq(table.post.id, postId), sql`${table.post.likesCount} > 0`));
  }

  // const [post] = await db
  //   .select({ likesCount: table.post.likesCount })
  //   .from(table.post)
  //   .where(eq(table.post.id, postId));
  //
  const updatedPost = await getPost({ postId, currentUserId: userId });

  if (updatedPost?.author) {
    await removeNotification({
      senderId: userId,
      recipientId: updatedPost.author.id,
      postId: postId,
      type: "post_like",
    });
  }

  return updatedPost;
  // return { ...deleted, likesCount: post?.likesCount ?? 0 };
};

export const likeComment = async ({
  userId,
  commentId,
  postId,
}: { userId: string; commentId: string; postId: string }) => {
  const existingLike = await db
    .select({ id: table.commentLike.id })
    .from(table.commentLike)
    .where(
      and(
        eq(table.commentLike.userId, userId),
        eq(table.commentLike.commentId, commentId),
      ),
    );

  if (existingLike.length > 0) {
    return null;
  }

  const [likeRecord] = await db
    .insert(table.commentLike)
    .values({
      userId,
      commentId,
      postId,
    })
    .returning();

  console.log("comment-like record:", likeRecord);

  await db
    .update(table.comment)
    .set({ likesCount: sql`${table.comment.likesCount} + 1` })
    .where(eq(table.comment.id, commentId));

  const [comment] = await db
    .select()
    .from(table.comment)
    .where(eq(table.comment.id, commentId));

  await createNotification({
    senderId: userId,
    recipientId: comment.authorId,
    postId: postId,
    commentId: commentId,
    type: "comment_like",
  });

  return comment;
};

export const unlikeComment = async ({
  userId,
  commentId,
}: { userId: string; commentId: string }) => {
  const existingLike = await db
    .select({ id: table.commentLike.id })
    .from(table.commentLike)
    .where(
      and(
        eq(table.commentLike.userId, userId),
        eq(table.commentLike.commentId, commentId),
      ),
    );

  if (existingLike.length === 0) {
    return null;
  }

  const [deleted] = await db
    .delete(table.commentLike)
    .where(
      and(
        eq(table.commentLike.userId, userId),
        eq(table.commentLike.commentId, commentId),
      ),
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

  const [comment] = await db
    .select()
    .from(table.comment)
    .where(eq(table.comment.id, commentId));

  await removeNotification({
    senderId: userId,
    recipientId: comment.authorId,
    commentId: commentId,
    type: "comment_like",
  });

  return comment;
};
