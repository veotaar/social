import { Elysia, t, NotFoundError } from "elysia";
import { db as model } from "@api/db/model";
import { betterAuth } from "../auth";
import {
  createComment,
  deleteComment,
  updateComment,
  getPostComments,
} from "./service";

const { comment } = model.insert;

export const commentRoute = new Elysia()
  .use(betterAuth)
  .guard({ auth: true })
  .post(
    "/comment/:postId",
    async ({ body, user, params }) => {
      const created = await createComment({
        userId: user.id,
        postId: params.postId,
        content: body.content,
        parentCommentId: body.parentCommentId,
        imageUrl: body.imageUrl,
      });
      return created;
    },
    {
      params: t.Object({
        postId: comment.postId,
      }),
      body: t.Object({
        content: comment.content,
        parentCommentId: t.Optional(comment.parentCommentId),
        imageUrl: t.Optional(comment.imageUrl),
      }),
    },
  )
  .get(
    "/comment/:postId",
    async ({ params: { postId }, query, user }) => {
      const { cursor, limit } = query;
      const data = await getPostComments({
        postId,
        currentUserId: user.id,
        cursor,
        limit,
      });
      return data;
    },
    {
      params: t.Object({
        postId: model.select.post.id,
      }),
      query: t.Object({
        cursor: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
      }),
    },
  )
  .delete(
    "/comment/:id",
    async ({ params: { id }, user }) => {
      const deleted = await deleteComment({ commentId: id, userId: user.id });
      if (!deleted)
        throw new NotFoundError("Comment not found or not authorized");
      return { success: true };
    },
    {
      params: t.Object({
        id: model.select.comment.id,
      }),
    },
  )
  .patch(
    "/comment/:id",
    async ({ params: { id }, body, user }) => {
      const updated = await updateComment({
        commentId: id,
        userId: user.id,
        content: body.content,
        imageUrl: body.imageUrl,
      });
      if (!updated)
        throw new NotFoundError("Comment not found or not authorized");
      return updated;
    },
    {
      params: t.Object({
        id: model.select.comment.id,
      }),
      body: t.Object({
        content: t.Optional(comment.content),
        imageUrl: t.Optional(comment.imageUrl),
      }),
    },
  );
