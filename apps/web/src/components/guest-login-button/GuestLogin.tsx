import { useMutation } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { cn } from "@web/lib/utils";
import { signIn } from "@web/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

const GuestLoginButton = () => {
  const navigate = useNavigate();

  const {
    mutate: signInAnonymous,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      await signIn.anonymous();
    },
    onSuccess: async () => {
      await navigate({ to: "/" });
    },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => signInAnonymous()}
        className={cn(
          "btn btn-outline btn-primary corner-squircle mt-4 w-full",
          {
            "btn-success btn-active": isSuccess,
            "btn-warning": isPending,
          },
        )}
      >
        {isSuccess ? (
          <>
            <span className="loading loading-spinner">loading</span>
            &nbsp;Logging in...
          </>
        ) : isPending ? (
          <>
            <span className="loading loading-spinner">loading</span>
            &nbsp;Creating your guest account...
          </>
        ) : (
          <>
            Instant Guest Login
            <LogIn />
          </>
        )}
      </button>
    </div>
  );
};

export default GuestLoginButton;
