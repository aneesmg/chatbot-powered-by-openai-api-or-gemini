import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(getToken: () => Promise<string | null>): Promise<Socket | null> {
  const token = await getToken();
  if (!token) return null;

  if (socket?.connected && token === currentToken) return socket;

  if (socket) {
    socket.disconnect();
  }

  currentToken = token;

  try {
    socket = io({
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 2,
      timeout: 5000,
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Socket connection timeout"));
      }, 5000);
      socket!.on("connect", () => {
        clearTimeout(timeout);
        resolve();
      });
      socket!.on("connect_error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    return socket;
  } catch {
    socket = null;
    currentToken = null;
    return null;
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

export function joinConversation(conversationId: string): void {
  if (socket?.connected) {
    socket.emit("join:conversation", conversationId);
  }
}

export function leaveConversation(conversationId: string): void {
  if (socket?.connected) {
    socket.emit("leave:conversation", conversationId);
  }
}
