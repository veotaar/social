import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "../auth";
import { deletePostAsAdmin, deleteCommentAsAdmin } from "./service";
import { getSystemSettings, updateSystemSettings } from "../settings/service";

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
  )
  .get("/admin/settings", async ({ user }) => {
    if (user.role !== "admin") {
      throw new NotFoundError();
    }

    const settings = await getSystemSettings();

    if (!settings) {
      throw new NotFoundError("Settings not found");
    }

    return settings;
  })
  .patch(
    "/admin/settings",
    async ({ user, body }) => {
      if (user.role !== "admin") {
        throw new NotFoundError();
      }

      const updated = await updateSystemSettings(body);

      if (!updated) {
        throw new NotFoundError("Settings not found");
      }

      return updated;
    },
    {
      body: t.Object({
        allowSignup: t.Optional(t.Boolean()),
        allowGuestLogin: t.Optional(t.Boolean()),
        maintenanceMode: t.Optional(t.Boolean()),
        guestPostLimit: t.Optional(t.Number()),
      }),
    },
  );
