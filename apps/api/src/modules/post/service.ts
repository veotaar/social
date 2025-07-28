import { table } from "@/db/model";
import db from "@/db/db";
import { and, desc, eq, notInArray, lt, isNull } from "drizzle-orm";
import { block, post, user } from "@/db/schema";

export const createPost = async ({
  userId,
  content,
}: { userId: string; content: string }) => {
  const [created] = await db
    .insert(table.post)
    .values({
      authorId: userId,
      content: content,
    })
    .returning();

  return created;
};

export const getFeedPosts = async ({
  currentUserId,
  limit = 10,
  cursor,
}: {
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

  const feed = await db
    .select({
      post: {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
      },
      author: {
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
      },
    })
    .from(post)
    .where(
      and(
        notInArray(post.authorId, blockedUsersSubQuery),
        notInArray(post.authorId, blockingUsersSubQuery),
        isNull(post.deletedAt),
        cursor ? lt(post.id, cursor) : undefined,
      ),
    )
    .orderBy(desc(post.id))
    .limit(limit + 1)
    .leftJoin(user, eq(post.authorId, user.id));

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
