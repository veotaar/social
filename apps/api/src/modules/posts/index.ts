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

const { post } = model.insert;

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
    "/posts/:postid",
    async ({ params: { postid }, user }) => {
      const singlePost = await getPost({
        postId: postid,
        currentUserId: user.id,
      });

      if (!singlePost) {
        throw new NotFoundError("Post not found");
      }

      return singlePost;
    },
    {
      params: t.Object({
        postid: model.select.post.id,
      }),
    },
  )
  .delete(
    "/posts/:postid",
    async ({ params: { postid }, user }) => {
      const deletedPost = await deletePost({ postId: postid, userId: user.id });

      if (!deletedPost) {
        throw new NotFoundError("Post not found or not authorized to delete");
      }

      return { message: "Post deleted successfully" };
    },
    {
      params: t.Object({
        postid: model.select.post.id,
      }),
    },
  )
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
      params: t.Object({
        postid: model.select.post.id,
      }),
      body: t.Object({
        content: t.String(),
      }),
    },
  );
