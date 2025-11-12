import { db as model } from "@api/db/model";
import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "../auth";
import { getUserById, editUserProfile } from "./service";

const { user } = model.select;

export const usersRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
    }),
  })
  .get("/users/:userid", async ({ user, params: { userid } }) => {
    const foundUser = await getUserById({ id: userid, currentUserId: user.id });
    if (!foundUser) throw new NotFoundError("User not found");

    return foundUser;
  })
  .patch(
    "/users/:userid",
    async ({ user, params: { userid }, body }) => {
      const editedUser = await editUserProfile({
        currentUserId: user.id,
        targetUserId: userid,
        ...body,
      });

      return editedUser;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        username: t.Optional(t.String()),
        displayUsername: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        image: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  );
