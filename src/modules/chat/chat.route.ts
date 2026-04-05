import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import {
  createChatRouteSchema,
  getChatMessagesRouteSchema,
  getChatsRouteSchema,
  sendMessageRouteSchema
} from "@/src/docs/chat";
import {
  createChatHandler,
  getChatMessagesHandler,
  getChatsHandler,
  sendChatMessageHandler
} from "./chat.service";

const chatRoute = async (app: FastifyInstance) => {
  app.post(
    "/",
    {
      schema: createChatRouteSchema,
      preHandler: [authenticate]
    },
    createChatHandler
  );

  app.get(
    "/",
    {
      schema: getChatsRouteSchema,
      preHandler: [authenticate]
    },
    getChatsHandler
  );

  app.get(
    "/:id/messages",
    {
      schema: getChatMessagesRouteSchema,
      preHandler: [authenticate]
    },
    getChatMessagesHandler
  );

  app.post(
    "/:id/messages",
    {
      schema: sendMessageRouteSchema,
      preHandler: [authenticate]
    },
    sendChatMessageHandler
  );
};

export default chatRoute;
