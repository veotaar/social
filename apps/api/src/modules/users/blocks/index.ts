import { db as model } from "@api/db/model";
import { Elysia, t, status } from "elysia";
import { betterAuth } from "@api/modules/auth";
import { getBlockedUsers } from "./service";
import { ForbiddenError } from "@api/lib/error";
const { user } = model.select;

export const userBlocksRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
    }),
  })
  .get(
    "/users/:userid/blocks",
    async ({ user, params: { userid }, query: { cursor } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      const blockedUsers = await getBlockedUsers({
        currentUserId: userid,
        limit: 10,
        cursor,
      });

      return blockedUsers;
    },
    {
      query: t.Object({
        cursor: t.String(),
      }),
    },
  );
