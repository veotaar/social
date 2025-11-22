import db from "@api/db/db";
import { table } from "@api/db/model";
import { and, desc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { getPost } from "@api/modules/posts/service";

export const addPostBookmark = async ({
  currentUserId,
  postId,
}: { currentUserId: string; postId: string }) => {
  const [postWithBlockCheck] = await db
    .select({
      postId: table.post.id,
      authorId: table.post.authorId,
      isBlocked: table.block.id,
    })
    .from(table.post)
    .leftJoin(
      table.block,
      and(
        eq(table.block.blockerId, table.post.authorId),
        eq(table.block.blockedId, currentUserId),
      ),
    )
    .where(eq(table.post.id, postId));

  if (!postWithBlockCheck) {
    throw new NotFoundError("Post not found");
  }

  if (postWithBlockCheck.isBlocked) {
    throw new NotFoundError("Post not found");
  }

  const [bookmark] = await db
    .insert(table.bookmark)
    .values({
      userId: currentUserId,
      postId,
    })
    .onConflictDoNothing()
    .returning();

  const updatedPost = await getPost({
    postId,
    currentUserId,
  });

  return updatedPost;
};

export const removePostBookmark = async ({
  currentUserId,
  bookmarkId,
}: { currentUserId: string; bookmarkId: string }) => {
  const [deleteResult] = await db
    .delete(table.bookmark)
    .where(
      and(
        eq(table.bookmark.userId, currentUserId),
        eq(table.bookmark.postId, bookmarkId),
      ),
    )
    .returning();

  if (!deleteResult) {
    throw new NotFoundError("Bookmark not found");
  }

  const updatedPost = await getPost({
    postId: deleteResult.postId,
    currentUserId,
  });

  return updatedPost;
};

export const getUserBookmarks = async ({
  currentUserId,
  limit = 10,
  cursor,
}: {
  currentUserId: string;
  limit?: number;
  cursor: string;
}) => {
  const blockedUsersSubQuery = db
    .select({ id: table.block.blockedId })
    .from(table.block)
    .where(eq(table.block.blockerId, currentUserId));

  const blockingUsersSubQuery = db
    .select({ id: table.block.blockerId })
    .from(table.block)
    .where(eq(table.block.blockedId, currentUserId));

  const applyCursor = cursor !== "initial";

  const feed = await db
    .select({
      bookmarkId: table.bookmark.id,
      post: {
        id: table.post.id,
        content: table.post.content,
        createdAt: table.post.createdAt,
        likesCount: table.post.likesCount,
        commentsCount: table.post.commentsCount,
        sharesCount: table.post.sharesCount,
        likedByCurrentUser: sql<boolean>`CASE WHEN ${table.postLike.id} IS NOT NULL THEN true ELSE false END`,
        isBookmarked: sql<boolean>`CASE WHEN ${table.bookmark.id} IS NOT NULL THEN true ELSE false END`,
      },
      author: {
        id: table.user.id,
        username: table.user.username,
        displayUsername: table.user.displayUsername,
        name: table.user.name,
        image: table.user.image,
      },
    })
    .from(table.post)
    .where(
      and(
        notInArray(table.post.authorId, blockedUsersSubQuery),
        notInArray(table.post.authorId, blockingUsersSubQuery),
        isNull(table.post.deletedAt),
        eq(table.bookmark.userId, currentUserId),
        applyCursor ? lt(table.post.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(table.post.id))
    .limit(limit + 1)
    .leftJoin(table.user, eq(table.post.authorId, table.user.id))
    .leftJoin(
      table.postLike,
      and(
        eq(table.postLike.postId, table.post.id),
        eq(table.postLike.userId, currentUserId),
      ),
    )
    .leftJoin(
      table.bookmark,
      and(
        eq(table.bookmark.postId, table.post.id),
        eq(table.bookmark.userId, currentUserId),
      ),
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

  return {
    posts: feed,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
};
