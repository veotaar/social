import { useSession } from "@web/lib/auth-client";
import { Trash2 as Trash } from "lucide-react";
import { useRef } from "react";
import type { PostData } from "./Post";
import { useDeletePost } from "./useDeletePost";

type DeleteButtonProps = {
  post: PostData;
};

export const DeletePostButton = ({ post }: DeleteButtonProps) => {
  const { data: userData } = useSession();
  const { mutate: deletePost, isPending } = useDeletePost();
  const modalRef = useRef<HTMLDialogElement>(null);

  const isAdmin = userData?.user.role === "admin";
  const showButton = isAdmin || userData?.user.id === post.author?.id;

  if (!showButton) {
    return null;
  }

  const handleDelete = () => {
    deletePost(
      { postId: post.post.id, asAdmin: isAdmin },
      {
        onSuccess: () => {
          modalRef.current?.close();
        },
      },
    );
  };

  const openModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square"
        onClick={openModal}
        aria-label="Delete post"
      >
        <Trash className="h-4 w-4" />
      </button>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete Post</h3>
          <p className="py-4">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </p>
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => modalRef.current?.close()}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-error"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={() => modalRef.current?.close()}>
            close
          </button>
        </form>
      </dialog>
    </>
  );
};
