import { Elysia, t } from "elysia";
import { db as model, table } from "@/db/model";
import db from "@/db/db";
import { betterAuth } from "../auth";

const { post } = model.insert;

export const createPost = new Elysia().use(betterAuth).post(
  "/post",
  async ({ body, user }) => {
    const [created] = await db
      .insert(table.post)
      .values({
        authorId: user.id,
        content: body.content,
      })
      .returning();

    return created;
  },
  {
    auth: true,
    body: t.Object({
      content: post.content,
    }),
  },
);
