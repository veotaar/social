import { db as model } from "@api/db/model";
import { Elysia, t, status } from "elysia";
import { betterAuth } from "@api/modules/auth";
import {
  listFollowers,
  listFollowing,
  unFollowUser,
  removeFollower,
  listMutualFollowers,
  removeFollowerMutually,
} from "./service";
import { ForbiddenError } from "@api/lib/error";

const { user } = model.select;

export const followsRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
    }),
  })
  .get("/users/:userid/followers", async ({ user, params: { userid } }) => {
    if (user.id !== userid) {
      throw new ForbiddenError("Forbidden");
    }

    const followers = await listFollowers({ userId: userid });
    return followers;
  })
  .get("/users/:userid/following", async ({ user, params: { userid } }) => {
    if (user.id !== userid) {
      throw new ForbiddenError("Forbidden");
    }

    const following = await listFollowing({ userId: userid });
    return following;
  })
  .get("/users/:userid/connections", async ({ user, params: { userid } }) => {
    if (user.id !== userid) {
      throw new ForbiddenError("Forbidden");
    }

    const mutualFollowers = await listMutualFollowers({ userId: userid });
    return mutualFollowers;
  })
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
      targetuserid: user.id,
    }),
  })
  .delete(
    "/users/:userid/followers/:targetuserid",
    async ({ user, params: { userid, targetuserid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      await removeFollower({
        currentUserId: userid,
        targetUserId: targetuserid,
      });

      return status(204);
    },
  )
  .delete(
    "/users/:userid/following/:targetuserid",
    async ({ user, params: { userid, targetuserid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      await unFollowUser({
        currentUserId: userid,
        targetUserId: targetuserid,
      });

      return status(204);
    },
  )
  .delete(
    "/users/:userid/connections/:targetuserid",
    async ({ user, params: { userid, targetuserid } }) => {
      if (user.id !== userid) {
        throw new ForbiddenError("Forbidden");
      }

      await removeFollowerMutually({
        currentUserId: userid,
        targetUserId: targetuserid,
      });

      return status(204);
    },
  );
