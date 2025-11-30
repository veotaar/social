import { shapes } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";
import { cn } from "@web/lib/utils";

type AvatarProps = {
  name: string;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const Avatar = ({ name, image, size, className }: AvatarProps) => {
  // TODO: remove useMemo later to take advantage of react compiler
  const avatar = useMemo(() => {
    return createAvatar(shapes, {
      seed: name,
      size: 128,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    }).toDataUri();
  }, [name]);

  return (
    <div className={cn("avatar", className)}>
      <div
        className={cn(
          {
            "w-8": size === "xs",
            "w-10": size === "sm",
            "w-12": size === "md" || !size,
            "w-16": size === "lg",
            "w-32": size === "xl",
          },
          "rounded-full",
        )}
      >
        <img src={image ?? avatar} alt="User avatar" />
      </div>
    </div>
  );
};

export default Avatar;
