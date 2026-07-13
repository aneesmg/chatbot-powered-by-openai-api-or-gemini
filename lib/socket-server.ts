import { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | undefined {
  return globalThis.__io;
}

export function setIO(io: SocketIOServer): void {
  globalThis.__io = io;
}
