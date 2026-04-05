import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/src/lib/prisma";
import { cleanupUserByEmail, createTestEmail, registerAndVerifyUser } from "@/src/test/helpers";

test("workflow routes cover user, chat, ai, analytics, payment, and file modules", async () => {
  const email = createTestEmail("workflow");
  const { app, verifyResponse } = await registerAndVerifyUser({
    email,
    name: "Workflow Tester"
  });

  try {
    const authData = verifyResponse.json().data as {
      user: { id: number };
      accessToken: string;
    };
    const userId = authData.user.id;
    const accessToken = authData.accessToken;

    const scenario = await prisma.scenario.create({
      data: {
        title: "Greeting Practice",
        description: "Basic introduction flow",
        config: {
          topic: "greetings",
          difficulty: "beginner"
        }
      }
    });

    const authHeaders = {
      authorization: `Bearer ${accessToken}`
    };

    const getUserResponse = await app.inject({
      method: "GET",
      url: `/api/v1/users/${userId}`,
      headers: authHeaders
    });

    assert.equal(getUserResponse.statusCode, 200);

    const updateUserResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/users/${userId}`,
      headers: authHeaders,
      payload: {
        bio: "Practicing every day"
      }
    });

    assert.equal(updateUserResponse.statusCode, 200);
    assert.equal(updateUserResponse.json().data.bio, "Practicing every day");

    const createChatResponse = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: authHeaders,
      payload: {
        title: "First Chat",
        scenarioId: scenario.id
      }
    });

    assert.equal(createChatResponse.statusCode, 201);
    const chatId = createChatResponse.json().data.id as string;

    const listChatsResponse = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: authHeaders
    });

    assert.equal(listChatsResponse.statusCode, 200);

    const sendMessageResponse = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/messages`,
      headers: authHeaders,
      payload: {
        message: "hello how are you"
      }
    });

    assert.equal(sendMessageResponse.statusCode, 200);
    assert.ok(sendMessageResponse.json().data.reply);

    const getMessagesResponse = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chatId}/messages`,
      headers: authHeaders
    });

    assert.equal(getMessagesResponse.statusCode, 200);
    assert.ok(getMessagesResponse.json().data.length >= 2);

    const aiGenerateResponse = await app.inject({
      method: "POST",
      url: "/api/v1/ai/generate",
      headers: authHeaders,
      payload: {
        chatId,
        message: "i am learn english",
        scenario: "Daily conversation practice"
      }
    });

    assert.equal(aiGenerateResponse.statusCode, 200);
    assert.ok(aiGenerateResponse.json().data.reply);

    const analyticsEventResponse = await app.inject({
      method: "POST",
      url: "/api/v1/analytics/events",
      headers: authHeaders,
      payload: {
        event: "chat_created",
        metadata: {
          chatId
        }
      }
    });

    assert.equal(analyticsEventResponse.statusCode, 201);

    const analyticsUserResponse = await app.inject({
      method: "GET",
      url: `/api/v1/analytics/users/${userId}`,
      headers: authHeaders
    });

    assert.equal(analyticsUserResponse.statusCode, 200);

    const subscribeResponse = await app.inject({
      method: "POST",
      url: "/api/v1/payments/subscribe",
      headers: authHeaders,
      payload: {
        provider: "stripe",
        status: "active"
      }
    });

    assert.equal(subscribeResponse.statusCode, 201);

    const webhookResponse = await app.inject({
      method: "POST",
      url: "/api/v1/payments/webhook",
      payload: {
        userId,
        provider: "stripe",
        status: "verified"
      }
    });

    assert.equal(webhookResponse.statusCode, 200);

    const uploadFileResponse = await app.inject({
      method: "POST",
      url: "/api/v1/files/upload",
      headers: authHeaders,
      payload: {
        url: "https://cdn.example.com/audio.mp3",
        type: "audio",
        size: 1024
      }
    });

    assert.equal(uploadFileResponse.statusCode, 201);

    await prisma.context.deleteMany({
      where: {
        chat_id: chatId
      }
    });
    await prisma.message.deleteMany({
      where: {
        chat_id: chatId
      }
    });
    await prisma.chats.deleteMany({
      where: {
        id: chatId
      }
    });
    await prisma.analyticsEvent.deleteMany({
      where: {
        user_id: userId
      }
    });
    await prisma.subscription.deleteMany({
      where: {
        user_id: userId
      }
    });
    await prisma.file.deleteMany({
      where: {
        user_id: userId
      }
    });
    await prisma.scenario.deleteMany({
      where: {
        id: scenario.id
      }
    });
  } finally {
    await app.close();
    await cleanupUserByEmail(email);
  }
});
