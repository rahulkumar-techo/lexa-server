import type { FastifyInstance } from "fastify";
import { IncomingMessage } from "http";
import { URL } from "url";
import { User, UserStatus } from "@/generated/prisma/client";
import authRepo from "@/src/modules/auth/auth.repo";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "@/src/modules/auth/auth.token";
import chatRepo from "@/src/modules/chat/chat.repo";
import { processChatMessage } from "@/src/modules/chat/chat.service";
import {
  SendMessagePayload,
  SocketMessage,
  TypingPayload
} from "@/src/types/socket.types";
import { writePrettyLog } from "@/src/utils/pretty-log";
import { RawData, WebSocket, WebSocketServer } from "ws";

type SocketClient = WebSocket & {
  user?: User;
  joinedChats: Set<string>;
};

type AuthResult = {
  user: User | null;
  reason: string | null;
};

type ChatRoomMap = Map<string, Set<SocketClient>>;

const socketLogger = {
  info: (message: string, context?: Record<string, unknown>) =>
    writePrettyLog("socket", "info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    writePrettyLog("socket", "warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    writePrettyLog("socket", "error", message, context)
};

// Cast the raw ws client once and attach chat room state to it.
const toSocketClient = (socket: WebSocket): SocketClient => {
  const client = socket as SocketClient;
  client.joinedChats = new Set<string>();
  return client;
};

// Send a typed websocket event only when the socket is still open.
const sendEvent = (socket: WebSocket, type: string, payload: unknown) => {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify({ type, payload }));
};

// Keep error responses consistent across all socket handlers.
const sendError = (socket: WebSocket, message: string) => {
  sendEvent(socket, "ERROR", { message });
};

// Normalize headers because Node can expose them as string arrays.
const readHeader = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

// Read a bearer token from values like "Bearer <token>".
const getBearerToken = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(" ");
  return scheme === "Bearer" && token ? token : null;
};

// Extract the access token from the cookie header when present.
const getCookieToken = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");

    if (name !== ACCESS_TOKEN_COOKIE || valueParts.length === 0) {
      continue;
    }

    return decodeURIComponent(valueParts.join("="));
  }

  return null;
};

// Accept auth from header, cookie, or websocket query string.
const getTokenFromRequest = (req: IncomingMessage) => {
  const headerToken = getBearerToken(readHeader(req.headers.authorization));

  if (headerToken) {
    return headerToken;
  }

  const cookieToken = getCookieToken(readHeader(req.headers.cookie));

  if (cookieToken) {
    return cookieToken;
  }

  if (!req.url) {
    return null;
  }

  const queryToken = new URL(req.url, "http://localhost").searchParams.get("token");
  return getBearerToken(queryToken) ?? queryToken;
};

const getSafeRequestUrl = (rawUrl?: string | null) => {
  if (!rawUrl) {
    return rawUrl ?? undefined;
  }

  const parsedUrl = new URL(rawUrl, "http://localhost");

  if (parsedUrl.searchParams.has("token")) {
    parsedUrl.searchParams.set("token", "[redacted]");
  }

  const search = parsedUrl.searchParams.toString();
  return `${parsedUrl.pathname}${search ? `?${search}` : ""}`;
};

// Verify the socket token and load the active user behind it.
const authenticateSocketUser = async (
  app: FastifyInstance,
  req: IncomingMessage
): Promise<AuthResult> => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return { user: null, reason: "token missing" };
  }

  try {
    const payload = verifyAccessToken(app, token);

    if (payload.type !== "access") {
      return { user: null, reason: "invalid token type" };
    }

    const user = await authRepo.getUser({ id: payload.sub });

    if (!user || !user.isVerified || user.status === UserStatus.BANNED) {
      return { user: null, reason: "user is not allowed" };
    }

    if (user.status === UserStatus.ACTIVE) {
      return { user, reason: null };
    }

    const activeUser = await authRepo.updateUser(user.id, { status: UserStatus.ACTIVE });
    return { user: activeUser, reason: null };
  } catch (error) {
    return {
      user: null,
      reason: error instanceof Error ? error.message : "token verification failed"
    };
  }
};

// Make sure the requested chat belongs to the connected user.
const getOwnedChat = async (userId: string, chatId: string) => {
  const chat = await chatRepo.getChatById(chatId);
  return chat && chat.userId === userId ? chat : null;
};

// Add the current socket to a chat room and track membership locally.
const joinChatRoom = (rooms: ChatRoomMap, socket: SocketClient, chatId: string) => {
  const room = rooms.get(chatId) ?? new Set<SocketClient>();
  room.add(socket);
  rooms.set(chatId, room);
  socket.joinedChats.add(chatId);
};

// Remove the socket from every joined room during disconnect or errors.
const leaveAllChatRooms = (rooms: ChatRoomMap, socket: SocketClient) => {
  for (const chatId of socket.joinedChats) {
    const room = rooms.get(chatId);

    if (!room) {
      continue;
    }

    room.delete(socket);

    if (room.size === 0) {
      rooms.delete(chatId);
    }
  }

  socket.joinedChats.clear();
};

// Send the same event to all clients currently inside one chat room.
const broadcastToRoom = (rooms: ChatRoomMap, chatId: string, type: string, payload: unknown) => {
  const room = rooms.get(chatId);

  if (!room) {
    return;
  }

  for (const client of room) {
    sendEvent(client, type, payload);
  }
};

// Convert raw websocket bytes into one of the supported socket messages.
const parseMessage = (raw: RawData): SocketMessage | null => {
  try {
    const content =
      typeof raw === "string"
        ? raw
        : Buffer.isBuffer(raw)
          ? raw.toString("utf8")
          : Array.isArray(raw)
            ? Buffer.concat(raw).toString("utf8")
            : Buffer.from(new Uint8Array(raw)).toString("utf8");

    return JSON.parse(content) as SocketMessage;
  } catch {
    return null;
  }
};

// Join a chat room and send the chat history back to the caller.
const handleJoinChat = async (rooms: ChatRoomMap, socket: SocketClient, chatId: string) => {
  if (!socket.user) {
    sendError(socket, "Unauthorized");
    return;
  }

  const chat = await getOwnedChat(socket.user.id, chatId);

  if (!chat) {
    sendError(socket, "Chat not found");
    return;
  }

  joinChatRoom(rooms, socket, chatId);

  const messages = await chatRepo.getChatMessages(chatId);

  sendEvent(socket, "JOINED_CHAT", {
    chatId,
    messages: messages.map((message) => ({
      id: message.id,
      chat_id: message.chatId,
      user_id: message.userId,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
      created_at: message.createdAt
    }))
  });
};

// Persist a user message, generate the AI reply, and broadcast both.
const handleSendMessage = async (
  rooms: ChatRoomMap,
  socket: SocketClient,
  payload: SendMessagePayload
) => {
  if (!socket.user) {
    sendError(socket, "Unauthorized");
    return;
  }

  if (!socket.joinedChats.has(payload.chatId)) {
    const chat = await getOwnedChat(socket.user.id, payload.chatId);

    if (!chat) {
      sendError(socket, "Chat not found");
      return;
    }

    joinChatRoom(rooms, socket, payload.chatId);
    socketLogger.info("auto joined chat", {
      userId: socket.user.id,
      chatId: payload.chatId
    });
  }

  const result = await processChatMessage({
    userId: socket.user.id,
    chatId: payload.chatId,
    message: payload.message,
    scenario: payload.scenario
  });

  if (!result) {
    sendError(socket, "Chat not found");
    return;
  }

  broadcastToRoom(rooms, payload.chatId, "MESSAGE_RECEIVED", result.userMessage);
  broadcastToRoom(rooms, payload.chatId, "AI_MESSAGE_RECEIVED", {
    message: result.assistantMessage,
    reply: result.reply
  });
};

// Broadcast typing only for users who already belong to the room.
const handleTyping = (
  rooms: ChatRoomMap,
  socket: SocketClient,
  payload: TypingPayload
) => {
  if (!socket.user || !socket.joinedChats.has(payload.chatId)) {
    return;
  }

  broadcastToRoom(rooms, payload.chatId, "TYPING", {
    chatId: payload.chatId,
    userId: socket.user.id
  });
};

// Route each parsed socket message to the correct handler.
const handleSocketMessage = async (
  rooms: ChatRoomMap,
  socket: SocketClient,
  message: SocketMessage
) => {
  socketLogger.info("message received", {
    userId: socket.user?.id,
    type: message.type,
    chatId: message.payload.chatId
  });

  switch (message.type) {
    case "JOIN_CHAT":
      await handleJoinChat(rooms, socket, message.payload.chatId);
      return;
    case "SEND_MESSAGE":
      await handleSendMessage(rooms, socket, message.payload);
      return;
    case "TYPING":
      handleTyping(rooms, socket, message.payload);
      return;
  }
};

// Register websocket lifecycle handlers for auth, messages, and cleanup.
export const registerChatSocket = (app: FastifyInstance, wss: WebSocketServer) => {
  const rooms: ChatRoomMap = new Map();

  socketLogger.info("websocket server ready", { path: "/ws" });

  wss.on("connection", async (rawSocket, req) => {
    const socket = toSocketClient(rawSocket);
    const auth = await authenticateSocketUser(app, req);

    if (!auth.user) {
      socketLogger.warn("connection rejected", {
        reason: auth.reason,
        url: getSafeRequestUrl(req.url)
      });
      sendError(socket, "Unauthorized");
      socket.close(1008, "Unauthorized");
      return;
    }

    socket.user = auth.user;

    socketLogger.info("client connected", {
      userId: socket.user.id,
      url: getSafeRequestUrl(req.url)
    });

    sendEvent(socket, "CONNECTED", {
      userId: socket.user.id
    });

    socket.on("message", async (raw) => {
      const message = parseMessage(raw);

      if (!message) {
        socketLogger.warn("invalid message received", {
          userId: socket.user?.id
        });
        sendError(socket, "Invalid message format");
        return;
      }

      await handleSocketMessage(rooms, socket, message);
    });

    socket.on("close", () => {
      socketLogger.info("client disconnected", {
        userId: socket.user?.id
      });
      leaveAllChatRooms(rooms, socket);
    });

    socket.on("error", (error) => {
      socketLogger.error("websocket error", {
        userId: socket.user?.id,
        error: error.message
      });
      leaveAllChatRooms(rooms, socket);
    });
  });
};
