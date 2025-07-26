import { table } from "@/db/model";
import db from "@/db/db";

export const createPost = async ({
  userId,
  content,
}: { userId: string; content: string }) => {
  const [created] = await db
    .insert(table.post)
    .values({
      authorId: userId,
      content: content,
    })
    .returning();

  return created;
};
