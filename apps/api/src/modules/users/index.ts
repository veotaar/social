import { db as model } from "@api/db/model";
import { Elysia, NotFoundError, t } from "elysia";
import { betterAuth } from "../auth";
import {
  getUserById,
  editUserProfile,
  createFollowRequest,
  updateFollowRequestStatus,
  getFollowRequests,
} from "./service";
import { ForbiddenError } from "@api/lib/error";

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
  .put(
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
  )
  .post(
    "/users/:userid/followRequests",
    async ({ user, params: { userid } }) => {
      const followRequest = await createFollowRequest({
        currentUserId: user.id,
        followerId: user.id,
        followeeId: userid,
      });

      return followRequest;
    },
  )
  .get(
    "/users/:userid/followRequests",
    async ({ user, params: { userid } }) => {
      if (user.id !== userid) throw new ForbiddenError("Forbidden");

      const followRequests = await getFollowRequests({
        userId: userid,
      });

      return followRequests;
    },
  )
  .guard({
    auth: true,
    params: t.Object({
      userid: user.id,
      followRequestId: t.String(),
    }),
  })
  .put(
    "/users/:userid/followRequests/:followRequestId/status",
    async ({ user, params: { userid, followRequestId }, body }) => {
      const updatedFollowRequest = await updateFollowRequestStatus({
        currentUserId: user.id,
        targetUserId: userid,
        followRequestId,
        newStatus: body.status,
      });

      return updatedFollowRequest;
    },
    {
      body: t.Object({
        status: t.Union([
          t.Literal("accepted"),
          t.Literal("rejected"),
          t.Literal("cancelled"),
        ]),
      }),
    },
  );
