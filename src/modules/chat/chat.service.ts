import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@/generated/prisma/client";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import { generateAIResponse } from "@/src/lib/ai";
import chatRepo, { MessageRole } from "./chat.repo";
import { createChatSchema, sendMessageSchema } from "./chat.schema";

const ensureAuthenticatedUser = (req: FastifyRequest) => {
  if (!req.authUser) {
    throw new Error("Unauthorized");
  }

  return req.authUser;
};

const ensureChatOwnership = async (req: FastifyRequest, chatId: string) => {
  const user = ensureAuthenticatedUser(req);
  const chat = await chatRepo.getChatById(chatId);

  if (!chat || chat.userId !== user.id) {
    return null;
  }

  return chat;
};

const buildScenarioPrompt = async (scenarioId?: string, scenarioText?: string) => {
  if (scenarioText) {
    return scenarioText;
  }

  if (!scenarioId) {
    return undefined;
  }

  const scenario = await chatRepo.getScenarioById(scenarioId);
  return scenario ? JSON.stringify(scenario.config) : undefined;
};

const toChatResponse = (
  chat: Awaited<ReturnType<typeof chatRepo.getChatById>> extends infer T ? Exclude<T, null> : never
) => ({
  id: chat.id,
  user_id: chat.userId,
  title: chat.title,
  status: chat.status,
  created_at: chat.createdAt,
  updated_at: chat.updatedAt
});

const toMessageResponse = (
  message: Awaited<ReturnType<typeof chatRepo.getChatMessages>>[number]
) => ({
  id: message.id,
  chat_id: message.chatId,
  user_id: message.userId,
  role: message.role,
  content: message.content,
  metadata: message.metadata,
  created_at: message.createdAt
});

export const createChatHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const user = ensureAuthenticatedUser(req);
    const payload = createChatSchema.parse(req.body);
    const chat = await chatRepo.createChat({
      userId: user.id,
      title: payload.title ?? "New chat",
      status: "ACTIVE"
    });

    if (payload.scenarioId) {
      await chatRepo.upsertContext(
        chat.id,
        {
          scenarioId: payload.scenarioId
        } as Prisma.InputJsonValue
      );
    }

    return responseHandler.created(res, toChatResponse(chat), "Chat created successfully");
  }
);

export const getChatsHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const user = ensureAuthenticatedUser(req);
    const chats = await chatRepo.getUserChats(user.id);

    return responseHandler.success(
      res,
      chats.map((chat) => toChatResponse(chat)),
      "Chats fetched successfully"
    );
  }
);

export const getChatMessagesHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const chat = await ensureChatOwnership(req, id);

    if (!chat) {
      return responseHandler.notFound(res, "Chat not found");
    }

    const messages = await chatRepo.getChatMessages(chat.id);

    return responseHandler.success(
      res,
      messages.map((message) => toMessageResponse(message)),
      "Chat messages fetched successfully"
    );
  }
);

export const sendChatMessageHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const user = ensureAuthenticatedUser(req);
    const { id } = req.params as { id: string };
    const payload = sendMessageSchema.parse(req.body);
    const chat = await ensureChatOwnership(req, id);

    if (!chat) {
      return responseHandler.notFound(res, "Chat not found");
    }

    const previousMessages = await chatRepo.getChatMessages(chat.id);
    const context = await chatRepo.getContextByChatId(chat.id);
    const storedScenarioId =
      context?.data && typeof context.data === "object" && !Array.isArray(context.data)
        ? String((context.data as Record<string, unknown>).scenarioId ?? "")
        : undefined;

    const userMessage = await chatRepo.createMessage({
      chatId: chat.id,
      userId: user.id,
      role: MessageRole.USER,
      content: payload.message
    });

    const history = previousMessages.slice(-10).map((message) => ({
      role:
        message.role === MessageRole.ASSISTANT
          ? ("assistant" as const)
          : ("user" as const),
      content: message.content
    }));

    const aiResponse = await generateAIResponse({
      userId: user.id,
      chatId: chat.id,
      message: payload.message,
      scenario: await buildScenarioPrompt(storedScenarioId, payload.scenario),
      history
    });

    const assistantMessage = await chatRepo.createMessage({
      chatId: chat.id,
      role: MessageRole.ASSISTANT,
      content: aiResponse.reply,
      metadata: (aiResponse.usage ?? null) as Prisma.InputJsonValue
    });

    await chatRepo.upsertContext(
      chat.id,
      {
        scenarioId: storedScenarioId || null,
        lastUserMessage: payload.message,
        lastAssistantReply: aiResponse.reply
      } as Prisma.InputJsonValue
    );

    await chatRepo.touchChat(chat.id);

    return responseHandler.success(
      res,
      {
        userMessage: toMessageResponse(userMessage),
        assistantMessage: toMessageResponse(assistantMessage),
        reply: aiResponse.reply
      },
      "Message sent successfully"
    );
  }
);
