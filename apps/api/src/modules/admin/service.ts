import db from "@api/db/db";
import { table } from "@api/db/model";
import { post, comment } from "@api/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export const deletePostAsAdmin = async ({ postId }: { postId: string }) => {
  const existingPost = await db
    .select()
    .from(post)
    .where(and(eq(post.id, postId), isNull(post.deletedAt)));

  if (existingPost.length === 0) {
    return null;
  }

  const [deleted] = await db
    .update(post)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(post.id, postId))
    .returning();

  await db
    .update(table.user)
    .set({ postsCount: sql`${table.user.postsCount} - 1` })
    .where(eq(table.user.id, deleted.authorId));

  return deleted;
};

export const deleteCommentAsAdmin = async ({
  postId,
  commentId,
}: {
  postId: string;
  commentId: string;
}) => {
  const [existing] = await db
    .select({
      id: comment.id,
      postId: comment.postId,
      postAuthorId: post.authorId,
    })
    .from(comment)
    .where(and(eq(comment.id, commentId), isNull(comment.deletedAt)))
    .leftJoin(post, eq(comment.postId, post.id));

  if (!existing) return null;
  if (existing.postId !== postId) return null;

  const [deleted] = await db
    .update(table.comment)
    .set({ deletedAt: new Date() })
    .where(eq(comment.id, commentId))
    .returning();

  // decrease commentsCount on post
  await db
    .update(table.post)
    .set({ commentsCount: sql`${post.commentsCount} - 1` })
    .where(and(eq(post.id, existing.postId), sql`${post.commentsCount} > 0`));

  await db
    .update(table.user)
    .set({ commentsCount: sql`${table.user.commentsCount} - 1` })
    .where(eq(table.user.id, deleted.authorId));

  return deleted;
};
