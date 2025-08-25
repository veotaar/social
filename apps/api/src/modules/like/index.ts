import { Elysia, t } from "elysia";
import { betterAuth } from "../auth";
import { likePost, unlikePost, likeComment, unlikeComment } from "./service";

export const likeRoute = new Elysia()
  .use(betterAuth)
  .guard({
    auth: true,
    params: t.Object({
      id: t.String(),
    }),
  })
  .post("/like/post/:id", async ({ user, params: { id } }) => {
    const liked = await likePost({
      userId: user.id,
      postId: id,
    });

    return liked;
  })
  .delete("/like/post/:id", async ({ user, params: { id } }) => {
    const unliked = await unlikePost({
      userId: user.id,
      postId: id,
    });

    return unliked;
  })
  .post("/like/comment/:id", async ({ user, params: { id } }) => {
    const liked = await likeComment({
      userId: user.id,
      commentId: id,
    });

    return liked;
  })
  .delete("/like/comment/:id", async ({ user, params: { id } }) => {
    const unliked = await unlikeComment({
      userId: user.id,
      commentId: id,
    });

    return unliked;
  });
