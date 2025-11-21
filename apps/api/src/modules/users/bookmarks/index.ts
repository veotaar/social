import { db as model } from "@api/db/model";
import { Elysia, t, status } from "elysia";
import {
  addPostBookmark,
  removePostBookmark,
  getUserBookmarks,
} from "./service";
import { betterAuth } from "@api/modules/auth";
import { ForbiddenError } from "@api/lib/error";

const { user } = model.select;

export const userBookmarksRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
    }),
  })
  .get(
    "/users/:userid/bookmarks",
    async ({ user, params: { userid }, query: { cursor } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      const bookmarks = await getUserBookmarks({
        currentUserId: userid,
        limit: 10,
        cursor,
      });

      return bookmarks;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  )
  .post(
    "/users/:userid/bookmarks",
    async ({ user, params: { userid }, body: { postid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      const bookmark = await addPostBookmark({
        currentUserId: userid,
        postId: postid,
      });

      return bookmark;
    },
    {
      body: t.Object({
        postid: t.String({ format: "uuid" }),
      }),
    },
  )
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
      bookmarkid: t.String({ format: "uuid" }),
    }),
  })
  .delete(
    "/users/:userid/bookmarks/:bookmarkid",
    async ({ user, params: { userid, bookmarkid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      const deletedBookmark = await removePostBookmark({
        currentUserId: userid,
        bookmarkId: bookmarkid,
      });

      return deletedBookmark;
    },
  );
