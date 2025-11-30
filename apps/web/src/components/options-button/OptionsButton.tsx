import type { Treaty } from "@elysiajs/eden";
import { client } from "@web/lib/api-client";
import { Ellipsis } from "lucide-react";
import { useBlockUser } from "../blocked-user/useBlockUser";
import { useUnblockUser } from "../blocked-user/useUnblockUser";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@web/lib/utils";

const userType = client.api.users({ userid: "string" }).get;

type User = Treaty.Data<typeof userType>;

export interface OptionsButtonProps {
  user: User;
}

export default function OptionsButton({ user }: OptionsButtonProps) {
  const queryClient = useQueryClient();

  const { mutate: block } = useBlockUser(user.id);
  const { mutate: unBlock } = useUnblockUser(user.id);

  const handleBlockToggle = () => {
    if (user.isBlocked) {
      unBlock(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", user.id] });
          queryClient.invalidateQueries({ queryKey: ["blockedAccounts"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts", user.id] });
        },
      });
    } else {
      block(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", user.id] });
          queryClient.invalidateQueries({ queryKey: ["blockedAccounts"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts", user.id] });
        },
      });
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        type="button"
        className="btn btn-circle btn-ghost btn-sm"
      >
        <Ellipsis className="h-5 w-5" />
      </button>
      <ul
        // tabIndex={0}
        className="dropdown-content menu z-1 min-w-32 rounded-box bg-base-100 p-2 shadow"
      >
        <li>
          <button
            type="button"
            onClick={handleBlockToggle}
            className={cn(user.isBlocked ? "" : "text-error")}
          >
            {user.isBlocked ? "Unblock User" : "Block User"}
          </button>
        </li>
      </ul>
    </div>
  );
}
