import { shapes } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";
import { cn } from "@web/lib/utils";

type AvatarProps = {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
};

const Avatar = ({ name, image, size }: AvatarProps) => {
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
        <div
          className={cn(
            {
              "w-10": size === "sm",
              "w-14": size === "md" || !size,
              "w-16": size === "lg",
            },
            "rounded-full",
          )}
        >
          <img src={image} alt="User avatar" />
        </div>
      </div>
    );
  }

  return (
    <div className="avatar">
      <div
        className={cn(
          {
            "w-10": size === "sm",
            "w-14": size === "md" || !size,
            "w-16": size === "lg",
          },
          "rounded-full",
        )}
      >
        <img src={avatar} alt="User avatar" />
      </div>
    </div>
  );
};

export default Avatar;
