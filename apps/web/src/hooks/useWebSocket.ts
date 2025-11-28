import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@web/lib/auth-client";
import { client } from "@web/lib/api-client";

type WSMessage =
  | { type: "new_notification"; payload: { notificationId: string } }
  | { type: "new_post"; payload: { postId: string; authorId: string } }
  | { type: "connected"; payload: { userId: string } }
  | { type: "pong" }
  | { type: "ping" };

type UseWebSocketOptions = {
  onNewPost?: (postId: string, authorId: string) => void;
  onNewNotification?: (notificationId: string) => void;
};

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
// in development, react strict mode double-mounts components causing duplicate WS connections
const IS_DEV = process.env.NODE_ENV === "development";

type EdenWebSocket = ReturnType<typeof client.ws.subscribe>;

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const wsRef = useRef<EdenWebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Store options in a ref to avoid dependency changes
  const optionsRef = useRef(options);
  optionsRef.current = options;
  // Track if component is mounted to prevent reconnect after unmount
  const isMountedRef = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!session?.user) return;
    if (!isMountedRef.current) return;

    // don't connect if already connected
    if (wsRef.current) {
      return;
    }

    const ws = client.ws.subscribe();
    wsRef.current = ws;

    ws.on("open", () => {
      console.log("[WS] Connected");
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
    });

    ws.subscribe((message) => {
      try {
        const data = message.data as WSMessage;

        switch (data.type) {
          case "connected":
            console.log("[WS] Authenticated as:", data.payload.userId);
            break;

          case "new_notification":
            console.log("[WS] New notification:", data.payload.notificationId);
            // invalidate notifications query to trigger refetch
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            optionsRef.current.onNewNotification?.(data.payload.notificationId);
            break;

          case "new_post":
            console.log("[WS] New post:", data.payload.postId);
            // don't auto-fetch, just increment counter
            // in dev mode, react strict mode causes double events
            // so increment by 0.5 to compensate
            setNewPostsCount((prev) => prev + (IS_DEV ? 0.5 : 1));
            optionsRef.current.onNewPost?.(
              data.payload.postId,
              data.payload.authorId,
            );
            break;

          case "pong":
            // console.log("[WS] Received pong");
            break;
        }
      } catch (e) {
        console.error("[WS] Failed to parse message:", e);
      }
    });

    ws.on("close", (event) => {
      console.log("[WS] Disconnected:", event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;

      // attempt reconnection with exponential backoff (only if still mounted)
      if (
        isMountedRef.current &&
        session?.user &&
        reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        const delay =
          INITIAL_RECONNECT_DELAY * 2 ** reconnectAttemptRef.current;
        console.log(
          `[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`,
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current++;
          connect();
        }, delay);
      }
    });

    ws.on("error", (error) => {
      console.error("[WS] Error:", error);
    });
  }, [session?.user, queryClient]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearReconnectTimeout]);

  // Reset new posts counter and optionally refetch feed
  const clearNewPosts = useCallback(
    (shouldRefetch = true) => {
      setNewPostsCount(0);
      if (shouldRefetch) {
        queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      }
    },
    [queryClient],
  );

  const send = useCallback((message: { type: string; payload?: unknown }) => {
    if (wsRef.current) {
      wsRef.current.send(message);
    }
  }, []);

  // connect when authenticated, disconnect when not
  useEffect(() => {
    isMountedRef.current = true;

    if (session?.user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [session?.user, connect, disconnect]);

  // keep-alive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      send({ type: "ping" });
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, send]);

  return {
    isConnected,
    newPostsCount: Math.floor(newPostsCount),
    clearNewPosts,
    send,
  };
};
