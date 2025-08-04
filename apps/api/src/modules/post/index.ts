import { Elysia, t } from "elysia";
import { db as model } from "@api/db/model";
import { betterAuth } from "../auth";
import { createPost, getFeedPosts } from "./service";

const { post } = model.insert;

export const postRoute = new Elysia()
  .use(betterAuth)
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
      auth: true,
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
      auth: true,
      query: t.Object({
        cursor: t.Optional(t.String()),
      }),
    },
  );
