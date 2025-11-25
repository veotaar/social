import * as React from "react";
import { useSession, type Session, type User } from "./auth-client";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isPending: boolean;
  isRefetching: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, isRefetching } = useSession();

  const contextValue = {
    isAuthenticated: !!data,
    user: data?.user ?? null,
    session: data,
    isPending,
    isRefetching,
  };

  // Show loading state while checking auth
  if (isPending) {
    return (
      <div className="flex min-h-screen min-w-full items-center justify-center bg-base-100">
        <span className="loading loading-ring loading-xl" />
      </div>
    );
  }

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
