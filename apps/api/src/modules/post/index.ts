import { Elysia, t, NotFoundError } from "elysia";
import { db as model } from "@api/db/model";
import { betterAuth } from "../auth";
import { createPost, getFeedPosts, getPost } from "./service";

const { post } = model.insert;

export const postRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
  })
  .post(
    "/post",
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
    "/post",
    async ({ user, query }) => {
      const { cursor } = query;
      const posts = await getFeedPosts({ currentUserId: user.id, cursor });

      return posts;
    },
    {
      query: t.Object({
        cursor: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/post/:id",
    async ({ params: { id }, user }) => {
      const singlePost = await getPost({ postId: id, currentUserId: user.id });

      if (!singlePost) {
        throw new NotFoundError("Post not found");
      }

      return singlePost;
    },
    {
      params: t.Object({
        id: model.select.post.id,
      }),
    },
  );
