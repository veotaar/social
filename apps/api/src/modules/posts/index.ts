import { Elysia, t, NotFoundError } from "elysia";
import { db as model } from "@api/db/model";
import { betterAuth } from "../auth";
import {
  createPost,
  getFeedPosts,
  getPost,
  INITIAL_CURSOR,
  deletePost,
  updatePost,
} from "./service";
import { createComment, getPostComments } from "./comments/service";

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
  );
