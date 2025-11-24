import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "../auth";
import { deletePostAsAdmin, deleteCommentAsAdmin } from "./service";

export const adminRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
  })
  .delete(
    "/admin/posts/:postId",
    async ({ params: { postId }, user }) => {
      if (user.role !== "admin") {
        throw new NotFoundError();
      }

      const deleted = await deletePostAsAdmin({ postId: postId });

      if (!deleted) {
        throw new NotFoundError();
      }

      return deleted;
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
    },
  )
  .delete(
    "/admin/posts/:postId/comments/:commentId",
    async ({ params: { postId, commentId }, user }) => {
      if (user.role !== "admin") {
        throw new NotFoundError();
      }

      const deleted = await deleteCommentAsAdmin({
        postId: postId,
        commentId: commentId,
      });

      if (!deleted) {
        throw new NotFoundError();
      }

      return deleted;
    },
    {
      params: t.Object({
        postId: t.String(),
        commentId: t.String(),
      }),
    },
  );
