import { useToggleLike } from "@web/components/post/useToggleLike";
import { cn } from "@web/lib/utils";
import { Bookmark } from "lucide-react";
import { useAddBookmark } from "./useAddBookmark";
import { useRemoveBookmark } from "./useRemoveBookmark";
import { useSession } from "@web/lib/auth-client";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  postId: string;
}

const BookmarkButton = ({ postId, isBookmarked }: BookmarkButtonProps) => {
  const { data: currentUserData } = useSession();

  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark(postId);

  if (!currentUserData) return null;

  return (
    <div className="group/like-button ml-auto flex w-min items-center">
      <button
        className="btn btn-circle btn-ghost hover:border-0 hover:bg-primary/10"
        type="button"
        onClick={() =>
          isBookmarked
            ? removeBookmark.mutate({
                bookmarkId: postId,
                userId: currentUserData.user.id,
              })
            : addBookmark.mutate({ postId, userId: currentUserData.user.id })
        }
      >
        <Bookmark
          className={cn("group-hover/like-button:stroke-primary", {
            "fill-primary stroke-primary": isBookmarked,
          })}
        />
      </button>
    </div>
  );
};

export default BookmarkButton;
