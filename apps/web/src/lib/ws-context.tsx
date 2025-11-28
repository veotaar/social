import { createContext, useContext, type ReactNode } from "react";
import { useWebSocket } from "@web/hooks/useWebSocket";

type WebSocketContextType = {
  isConnected: boolean;
  newPostsCount: number;
  clearNewPosts: (shouldRefetch?: boolean) => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, newPostsCount, clearNewPosts } = useWebSocket();

  return (
    <WebSocketContext.Provider
      value={{ isConnected, newPostsCount, clearNewPosts }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
};
