import { Server } from "http";
import { WebSocketServer } from "ws";

// Attach a websocket server to the existing Fastify HTTP server.
export const attachWebSocketServer = (server: Server) =>
  new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024
  });
