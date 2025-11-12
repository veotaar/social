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
      // delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await signIn.anonymous();
    },
    onSuccess: () => {
      setTimeout(async () => {
        await navigate({ to: "/" });
      }, 1000);
    },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => signInAnonymous()}
        className={cn("btn btn-dash btn-primary mt-4 w-full", {
          "btn-success btn-active": isSuccess,
          "btn-warning": isPending,
        })}
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
            One Click Guest Login
            <LogIn />
          </>
        )}
      </button>
    </div>
  );
};

export default GuestLoginButton;
