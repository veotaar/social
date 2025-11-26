import { Elysia, t } from "elysia";
import { betterAuth } from "../auth";
import { uploadImage, uploadPostImages } from "./service";

export const uploadRoute = new Elysia({ prefix: "/upload" })
  .use(betterAuth)
  .guard({
    auth: true,
  })
  .post(
    "/image",
    async ({ body, user }) => {
      const { file, type } = body;

      if (type !== "comment" && type !== "profile") {
        throw new Error("Invalid upload type. Use 'comment' or 'profile'");
      }

      const result = await uploadImage({
        file,
        uploadType: type,
        userId: user.id,
      });

      return result;
    },
    {
      body: t.Object({
        file: t.File({
          type: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maxSize: "10m",
        }),
        type: t.Union([t.Literal("comment"), t.Literal("profile")]),
      }),
    },
  )
  .post(
    "/postimages",
    async ({ body, user }) => {
      const { files } = body;

      const fileArray = Array.isArray(files) ? files : [files];

      if (fileArray.length > 4) {
        throw new Error("Maximum 4 images allowed per post");
      }

      const results = await uploadPostImages({
        files: fileArray,
        userId: user.id,
      });

      return { images: results };
    },
    {
      body: t.Object({
        files: t.Files({
          type: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maxSize: "10m",
        }),
      }),
    },
  );
