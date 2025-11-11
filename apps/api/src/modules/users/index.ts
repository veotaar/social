import { db as model } from "@api/db/model";
import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "../auth";
import { getUserById } from "./service";

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
  });
