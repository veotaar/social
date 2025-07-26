import { Elysia, t } from "elysia";
import { betterAuth } from "../auth";
import { blockUser } from "./service";

export const blockRoute = new Elysia().use(betterAuth).post(
  "/block/:id",
  async ({ user, params: { id } }) => {
    const blocked = await blockUser({
      blockerId: user.id,
      blockedId: id,
    });

    return blocked;
  },
  {
    auth: true,
    params: t.Object({
      id: t.String(),
    }),
  },
);
