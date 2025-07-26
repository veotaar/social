import { Elysia, t } from "elysia";
import { db as model } from "@/db/model";
import { betterAuth } from "../auth";
import { createPost } from "./service";

const { post } = model.insert;

export const postRoute = new Elysia().use(betterAuth).post(
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
);
