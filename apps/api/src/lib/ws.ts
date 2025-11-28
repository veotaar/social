import { getBlockedUserIds } from "@api/modules/block/service";

export type WSMessage =
  | { type: "new_notification"; payload: { notificationId: string } }
  | { type: "new_post"; payload: { postId: string; authorId: string } }
  | { type: "connected"; payload: { userId: string } }
  | { type: "pong" }
  | { type: "ping" };

interface WSConnection {
  send: (message: unknown) => unknown;
}

const connectedUsers = new Map<string, Map<string, WSConnection>>();

let connectionIdCounter = 0;

export const generateConnectionId = (): string => {
  return `conn_${++connectionIdCounter}_${Date.now()}`;
};

export const registerConnection = (
  userId: string,
  connectionId: string,
  ws: WSConnection,
) => {
  let userConnections = connectedUsers.get(userId);
  if (!userConnections) {
    userConnections = new Map();
    connectedUsers.set(userId, userConnections);
  }
  userConnections.set(connectionId, ws);
  console.log(
    `[WS] User ${userId} connected (${connectionId}). Total connections: ${userConnections.size}`,
  );
};

export const unregisterConnection = (userId: string, connectionId: string) => {
  const userConnections = connectedUsers.get(userId);
  if (userConnections) {
    userConnections.delete(connectionId);
    if (userConnections.size === 0) {
      connectedUsers.delete(userId);
    }
  }
  console.log(
    `[WS] User ${userId} disconnected (${connectionId}). Remaining connections: ${connectedUsers.get(userId)?.size ?? 0}`,
  );
};

export const sendToUser = (userId: string, message: WSMessage) => {
  const userConnections = connectedUsers.get(userId);
  if (userConnections) {
    const messageStr = JSON.stringify(message);
    for (const ws of userConnections.values()) {
      ws.send(messageStr);
    }
  }
};

export const sendToUsers = (userIds: string[], message: WSMessage) => {
  const messageStr = JSON.stringify(message);
  for (const userId of userIds) {
    const userConnections = connectedUsers.get(userId);
    if (userConnections) {
      for (const ws of userConnections.values()) {
        ws.send(messageStr);
      }
    }
  }
};

export const isUserConnected = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

export const getConnectedUserIds = (): string[] => {
  return Array.from(connectedUsers.keys());
};

export const broadcastNewNotification = (
  recipientId: string,
  notificationId: string,
) => {
  if (isUserConnected(recipientId)) {
    sendToUser(recipientId, {
      type: "new_notification",
      payload: { notificationId },
    });
  }
};

export const broadcastNewPost = async (authorId: string, postId: string) => {
  const connectedUserIds = getConnectedUserIds();

  if (connectedUserIds.length === 0) return;

  const blockedByList = await getBlockedUserIds(authorId);
  const blockedBySet = new Set(blockedByList);

  // filter out the author themselves and blocked users
  const eligibleUsers = connectedUserIds.filter(
    (userId) => userId !== authorId && !blockedBySet.has(userId),
  );

  // send new_post message to eligible users
  if (eligibleUsers.length > 0) {
    sendToUsers(eligibleUsers, {
      type: "new_post",
      payload: { postId, authorId },
    });
  }
};
