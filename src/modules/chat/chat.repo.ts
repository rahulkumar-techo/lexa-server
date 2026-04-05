import { prisma } from "@/src/lib/prisma";
import { Chats, Context, Message, MessageRole, Prisma, Scenario } from "@/generated/prisma/client";

class ChatRepo {
  async createChat(data: Prisma.ChatsUncheckedCreateInput): Promise<Chats> {
    return prisma.chats.create({
      data
    });
  }

  async getUserChats(userId: number): Promise<Chats[]> {
    return prisma.chats.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        updated_at: "desc"
      }
    });
  }

  async getChatById(id: string): Promise<Chats | null> {
    return prisma.chats.findUnique({
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
        chat_id: chatId
      },
      orderBy: {
        created_at: "asc"
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
        chat_id: chatId
      },
      create: {
        chat_id: chatId,
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
        chat_id: chatId
      }
    });
  }

  async touchChat(chatId: string): Promise<Chats> {
    return prisma.chats.update({
      where: { id: chatId },
      data: {
        updated_at: new Date(),
        status: "ACTIVE"
      }
    });
  }
}

export { ChatRepo, MessageRole };
export default new ChatRepo();
