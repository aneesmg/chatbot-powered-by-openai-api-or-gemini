import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(getToken: () => Promise<string | null>): Promise<Socket> {
  const token = await getToken();
  if (!token) throw new Error("No auth token");

  if (socket?.connected && token === currentToken) return socket;

  if (socket) {
    socket.disconnect();
  }

  currentToken = token;

  socket = io({
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

export function joinConversation(conversationId: string): void {
  socket?.emit("join:conversation", conversationId);
}

export function leaveConversation(conversationId: string): void {
  socket?.emit("leave:conversation", conversationId);
}
