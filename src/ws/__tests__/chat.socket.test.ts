import assert from "node:assert/strict";
import test from "node:test";
import WebSocket, { RawData } from "ws";
import { prisma } from "@/src/lib/prisma";
import { cleanupUserByEmail, createTestEmail, registerAndVerifyUser } from "@/src/test/helpers";
import { attachWebSocketServer } from "@/src/ws/ws.server";
import { registerChatSocket } from "@/src/ws/chat.socket";

type SocketEvent = {
  type: string;
  payload: Record<string, unknown>;
};

const waitForOpen = (socket: WebSocket) =>
  new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });

const waitForSocketEvent = (
  socket: WebSocket,
  eventType: string
) =>
  new Promise<SocketEvent>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventType}`));
    }, 10000);

    const handleMessage = (raw: RawData) => {
      const message = JSON.parse(raw.toString()) as SocketEvent;

      if (message.type !== eventType) {
        return;
      }

      cleanup();
      resolve(message);
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("message", handleMessage);
      socket.off("error", handleError);
    };

    socket.on("message", handleMessage);
    socket.on("error", handleError);
  });

test("websocket chat joins a room and returns persisted user and assistant messages", async () => {
  const email = createTestEmail("ws");
  const { app, verifyResponse } = await registerAndVerifyUser({
    email,
    name: "Socket Tester"
  });

  const wss = attachWebSocketServer(app.server);
  registerChatSocket(app, wss);

  await app.listen({ port: 0, host: "127.0.0.1" });

  const address = app.server.address();

  if (!address || typeof address === "string") {
    throw new Error("Expected an address object from the HTTP server");
  }

  const accessToken = verifyResponse.json().data.accessToken as string;
  const authHeaders = {
    authorization: `Bearer ${accessToken}`
  };

  let chatId = "";
  let socket: WebSocket | null = null;

  try {
    const createChatResponse = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: authHeaders,
      payload: {
        title: "Socket Chat"
      }
    });

    assert.equal(createChatResponse.statusCode, 201);
    chatId = createChatResponse.json().data.id as string;

    socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`, {
      headers: authHeaders
    });

    const connectedEventPromise = waitForSocketEvent(socket, "CONNECTED");
    await waitForOpen(socket);
    await connectedEventPromise;

    const joinedEventPromise = waitForSocketEvent(socket, "JOINED_CHAT");
    socket.send(
      JSON.stringify({
        type: "JOIN_CHAT",
        payload: {
          chatId
        }
      })
    );

    const joinedEvent = await joinedEventPromise;
    assert.equal(joinedEvent.payload.chatId, chatId);

    const userMessageEventPromise = waitForSocketEvent(socket, "MESSAGE_RECEIVED");
    const assistantMessageEventPromise = waitForSocketEvent(socket, "AI_MESSAGE_RECEIVED");
    socket.send(
      JSON.stringify({
        type: "SEND_MESSAGE",
        payload: {
          chatId,
          message: "hello from websocket"
        }
      })
    );

    const userMessageEvent = await userMessageEventPromise;
    assert.equal(userMessageEvent.payload.chat_id, chatId);
    assert.equal(userMessageEvent.payload.role, "USER");
    assert.equal(userMessageEvent.payload.content, "hello from websocket");

    const assistantMessageEvent = await assistantMessageEventPromise;
    const assistantMessage = assistantMessageEvent.payload.message as Record<string, unknown>;

    assert.equal(assistantMessage.chat_id, chatId);
    assert.equal(assistantMessage.role, "ASSISTANT");
    assert.equal(typeof assistantMessageEvent.payload.reply, "string");

    const storedMessages = await prisma.message.findMany({
      where: {
        chatId
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    assert.equal(storedMessages.length, 2);
    assert.equal(storedMessages[0]?.content, "hello from websocket");
    assert.ok(storedMessages[1]?.content);
  } finally {
    if (socket) {
      socket.close();
    }

    if (chatId) {
      await prisma.context.deleteMany({
        where: {
          chatId
        }
      });
      await prisma.message.deleteMany({
        where: {
          chatId
        }
      });
      await prisma.chat.deleteMany({
        where: {
          id: chatId
        }
      });
    }

    await app.close();
    await cleanupUserByEmail(email);
  }
});
