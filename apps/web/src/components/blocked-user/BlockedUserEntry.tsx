import { client } from "@web/lib/api-client";
import type { Treaty } from "@elysiajs/eden";
import Avatar from "@web/components/avatar/Avatar";
import { useUnblockUser } from "./useUnblockUser";
import { useBlockUser } from "./useBlockUser";
import { Link } from "@tanstack/react-router";
import { cn } from "@web/lib/utils";
import { useState } from "react";

const blockedUserType = client.api.users({ userid: "string" }).blocks.get;

type BlockedUser = Treaty.Data<typeof blockedUserType>["blockedUsers"][number];

export interface BlockedUserEntryProps {
  user: BlockedUser;
}

export default function BlockedUserEntry({ user }: BlockedUserEntryProps) {
  const [isBlockedState, setIsBlockedState] = useState(true);
  const { mutate: unBlock, isPending: isUnblockPending } = useUnblockUser(
    user.id,
  );
  const { mutate: block, isPending: isBlockPending } = useBlockUser(user.id);

  const handleToggleBlock = () => {
    if (isBlockedState) {
      unBlock(undefined, { onSuccess: () => setIsBlockedState(false) });
    } else {
      block(undefined, { onSuccess: () => setIsBlockedState(true) });
    }
  };

  const isLoading = isUnblockPending || isBlockPending;

  return (
    <div className="flex items-center gap-4 border-base-300 border-b px-3 py-2">
      <div className="flex items-center gap-4">
        <Link
          to="/users/$userid"
          params={{ userid: user.id }}
          className="flex items-center gap-3"
        >
          <Avatar name={user.name} image={user.image} size="sm" />
          <div>
            <p className="font-medium">{user.displayUsername}</p>
            <p className="text-base-content/70 text-sm">@{user.username}</p>
          </div>
        </Link>
      </div>
      <button
        type="button"
        onClick={handleToggleBlock}
        disabled={isLoading}
        className={cn(
          "btn btn-sm ml-auto w-24",
          isBlockedState ? "btn-error" : "btn-outline",
        )}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : isBlockedState ? (
          "Blocked"
        ) : (
          "Block"
        )}
      </button>
    </div>
  );
}
