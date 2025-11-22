import { db as model } from "@api/db/model";
import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "../auth";
import {
  createComment,
  deleteComment,
  getPostComments,
  updateComment,
} from "./comments/service";
import {
  getCommentLikes,
  getPostLikes,
  likeComment,
  likePost,
  unlikeComment,
  unlikePost,
} from "./likes/service";
import {
  INITIAL_CURSOR,
  createPost,
  deletePost,
  getFeedPosts,
  getFollowingFeedPosts,
  getPost,
  updatePost,
} from "./service";

const { post, comment } = model.insert;

export const postsRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
  })
  .post(
    "/posts",
    async ({ body, user }) => {
      const created = await createPost({
        userId: user.id,
        content: body.content,
      });

      return created;
    },
    {
      body: t.Object({
        content: post.content,
      }),
    },
  )
  .get(
    "/posts",
    async ({ user, query }) => {
      const { cursor } = query;
      const posts = await getFeedPosts({ currentUserId: user.id, cursor });

      return posts;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  )
  .get(
    "/posts/following",
    async ({ user, query }) => {
      const { cursor } = query;
      const posts = await getFollowingFeedPosts({
        currentUserId: user.id,
        cursor,
      });

      return posts;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  )
  .guard({
    params: t.Object({
      postid: model.select.post.id,
    }),
  })
  .get("/posts/:postid", async ({ params: { postid }, user }) => {
    const singlePost = await getPost({
      postId: postid,
      currentUserId: user.id,
    });

    if (!singlePost) {
      throw new NotFoundError("Post not found");
    }

    return singlePost;
  })
  .delete("/posts/:postid", async ({ params: { postid }, user }) => {
    const deletedPost = await deletePost({ postId: postid, userId: user.id });

    if (!deletedPost) {
      throw new NotFoundError("Post not found or not authorized to delete");
    }

    return { message: "Post deleted successfully" };
  })
  .patch(
    "/posts/:postid",
    async ({ params: { postid }, body, user }) => {
      const updatedPost = await updatePost({
        postId: postid,
        userId: user.id,
        content: body.content,
      });

      if (!updatedPost) {
        throw new NotFoundError("Post not found or not authorized to update");
      }

      return updatedPost;
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    },
  )
  .post("/posts/:postid/likes", async ({ user, params: { postid } }) => {
    const liked = await likePost({
      userId: user.id,
      postId: postid,
    });

    return liked;
  })
  .delete("/posts/:postid/likes", async ({ user, params: { postid } }) => {
    const unliked = await unlikePost({
      userId: user.id,
      postId: postid,
    });

    return unliked;
  })
  .get(
    "/posts/:postid/likes",
    async ({ user, query, params: { postid } }) => {
      const { cursor } = query;
      const likes = await getPostLikes({
        userId: user.id,
        postId: postid,
        cursor,
      });
      return likes;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  )
  .post(
    "/posts/:postid/comments",
    async ({ body, user, params }) => {
      const created = await createComment({
        userId: user.id,
        postId: params.postid,
        content: body.content,
        parentCommentId: body.parentCommentId,
        imageUrl: body.imageUrl,
      });
      return created;
    },
    {
      body: t.Object({
        content: comment.content,
        parentCommentId: t.Optional(comment.parentCommentId),
        imageUrl: t.Optional(comment.imageUrl),
      }),
    },
  )
  .get(
    "/posts/:postid/comments",
    async ({ params: { postid }, query, user }) => {
      const { cursor, limit } = query;
      const data = await getPostComments({
        postId: postid,
        currentUserId: user.id,
        cursor,
        limit,
      });
      return data;
    },
    {
      query: t.Object({
        cursor: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
      }),
    },
  )
  .guard({
    params: t.Object({
      postid: model.select.post.id,
      commentid: model.select.comment.id,
    }),
  })
  .patch(
    "/posts/:postid/comments/:commentid",
    async ({ params: { commentid, postid }, body, user }) => {
      const updatedComment = await updateComment({
        postId: postid,
        commentId: commentid,
        userId: user.id,
        content: body.content,
        imageUrl: body.imageUrl,
      });

      if (!updatedComment) {
        throw new NotFoundError(
          "Comment not found or not authorized to update",
        );
      }

      return updatedComment;
    },
    {
      body: t.Object({
        content: t.String(),
        imageUrl: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    "/posts/:postid/comments/:commentid",
    async ({ params: { commentid, postid }, user }) => {
      const deletedComment = await deleteComment({
        postId: postid,
        commentId: commentid,
        userId: user.id,
      });

      if (!deletedComment) {
        throw new NotFoundError(
          "Comment not found or not authorized to delete",
        );
      }

      return { message: "Comment deleted successfully" };
    },
  )
  .post(
    "/posts/:postid/comments/:commentid/likes",
    async ({ user, params: { commentid, postid } }) => {
      const liked = await likeComment({
        userId: user.id,
        commentId: commentid,
        postId: postid,
      });

      return liked;
    },
  )
  .delete(
    "/posts/:postid/comments/:commentid/likes",
    async ({ user, params: { commentid } }) => {
      const unliked = await unlikeComment({
        userId: user.id,
        commentId: commentid,
      });

      return unliked;
    },
  )
  .get(
    "/posts/:postid/comments/:commentid/likes",
    async ({ user, query, params: { commentid } }) => {
      const { cursor } = query;
      const likes = await getCommentLikes({
        userId: user.id,
        commentId: commentid,
        cursor,
      });
      return likes;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  );
