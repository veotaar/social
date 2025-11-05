import { shapes } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import type { Treaty } from "@elysiajs/eden";
import type { client } from "@web/lib/api-client";
import { useMemo } from "react";

type AvatarData = Pick<
  NonNullable<
    Omit<
      Treaty.Data<typeof client.posts.get>,
      "pagination"
    >["posts"][number]["author"]
  >,
  "name" | "image"
>;

const Avatar = ({ name, image }: AvatarData) => {
  // TODO: remove useMemo later to take advantage of react compiler
  const avatar = useMemo(() => {
    return createAvatar(shapes, {
      seed: name,
      size: 128,
    }).toDataUri();
  }, [name]);

  if (image) {
    return (
      <div className="avatar">
        <div className="w-24 rounded-full">
          <img src={image} alt="User avatar" />
        </div>
      </div>
    );
  }

  return (
    <div className="avatar">
      <div className="w-24 rounded-full">
        <img src={avatar} alt="User avatar" />
      </div>
    </div>
  );
};

export default Avatar;
