import { prisma } from "@/src/lib/prisma";
import { Chat, Context, Message, MessageRole, Prisma, Scenario } from "@/generated/prisma/client";

class ChatRepo {
  async createChat(data: Prisma.ChatUncheckedCreateInput): Promise<Chat> {
    return prisma.chat.create({
      data
    });
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return prisma.chat.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }

  async getChatById(id: string): Promise<Chat | null> {
    return prisma.chat.findUnique({
      where: { id }
    });
  }

  async getScenarioById(id: string): Promise<Scenario | null> {
    return prisma.scenario.findUnique({
      where: { id }
    });
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        chatId
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async createMessage(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return prisma.message.create({
      data
    });
  }

  async upsertContext(chatId: string, data: Prisma.InputJsonValue): Promise<Context> {
    return prisma.context.upsert({
      where: {
        chatId
      },
      create: {
        chatId,
        data
      },
      update: {
        data
      }
    });
  }

  async getContextByChatId(chatId: string): Promise<Context | null> {
    return prisma.context.findUnique({
      where: {
        chatId
      }
    });
  }

  async touchChat(chatId: string): Promise<Chat> {
    return prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        status: "ACTIVE"
      }
    });
  }
}

export { ChatRepo, MessageRole };
export default new ChatRepo();
