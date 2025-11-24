import { useSession } from "@web/lib/auth-client";
import { useBanUser } from "./useBanUser";
import { useUnbanUser } from "./useUnbanUser";
import { useRemoveUser } from "./useRemoveUser";
import { Gavel } from "lucide-react";

type ModerateButtonProps = {
  userId: string;
  isBanned: boolean | null;
};

export const ModerateButton = ({ userId, isBanned }: ModerateButtonProps) => {
  const { data: userData } = useSession();

  const isAdmin = userData?.user.role === "admin";

  const { mutate: banUser } = useBanUser();
  const { mutate: unbanUser } = useUnbanUser();
  const { mutate: removeUser } = useRemoveUser();

  if (!isAdmin) {
    return null;
  }

  const handleRemove = () => {
    if (
      window.confirm(
        "Are you sure you want to remove this user? This action cannot be undone.",
      )
    ) {
      removeUser(userId);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn btn-outline btn-sm">
        <Gavel />
      </button>
      <ul className="menu dropdown-content z-1 w-34 rounded-box bg-base-100 p-2 shadow">
        {isBanned ? (
          <li>
            <button type="button" onClick={() => unbanUser(userId)}>
              Unban User
            </button>
          </li>
        ) : (
          <li>
            <button type="button" onClick={() => banUser(userId)}>
              Ban User
            </button>
          </li>
        )}
        <li>
          <button type="button" onClick={handleRemove} className="text-error">
            Remove User
          </button>
        </li>
      </ul>
    </div>
  );
};
