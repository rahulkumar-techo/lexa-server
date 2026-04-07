const chatSchema = {
  type: "object",
  required: ["id", "user_id", "title", "status", "created_at", "updated_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    title: { type: "string" },
    status: {
      type: "string",
      enum: ["ACTIVE", "INACTIVE", "BANNED"]
    },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" }
  }
} as const;

const messageSchema = {
  type: "object",
  required: ["id", "chat_id", "role", "content", "created_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    chat_id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid", nullable: true },
    role: {
      type: "string",
      enum: ["USER", "ASSISTANT", "SYSTEM"]
    },
    content: { type: "string" },
    metadata: {
      type: "object",
      nullable: true,
      additionalProperties: true
    },
    created_at: { type: "string", format: "date-time" }
  }
} as const;

const basicErrorSchema = {
  type: "object",
  required: ["success", "message"],
  properties: {
    success: { type: "boolean" },
    message: { type: "string" }
  }
} as const;

export const createChatBodySchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 2, maxLength: 100 },
    scenarioId: { type: "string", format: "uuid" }
  },
  additionalProperties: false
} as const;

export const sendMessageBodySchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string", minLength: 1, maxLength: 4000 },
    scenario: { type: "string", maxLength: 1000 }
  },
  additionalProperties: false
} as const;

export const createChatRouteSchema = {
  tags: ["Chat"],
  summary: "Create chat session",
  body: createChatBodySchema,
  response: {
    201: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: chatSchema
      }
    },
    401: basicErrorSchema
  }
} as const;

export const getChatsRouteSchema = {
  tags: ["Chat"],
  summary: "Get user chats",
  response: {
    200: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "array",
          items: chatSchema
        }
      }
    },
    401: basicErrorSchema
  }
} as const;

export const getChatMessagesRouteSchema = {
  tags: ["Chat"],
  summary: "Get chat messages",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid" }
    }
  },
  response: {
    200: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "array",
          items: messageSchema
        }
      }
    },
    401: basicErrorSchema,
    404: basicErrorSchema
  }
} as const;

export const sendMessageRouteSchema = {
  tags: ["Chat"],
  summary: "Send message",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid" }
    }
  },
  body: sendMessageBodySchema,
  response: {
    200: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          required: ["userMessage", "assistantMessage", "reply"],
          properties: {
            userMessage: messageSchema,
            assistantMessage: messageSchema,
            reply: { type: "string" }
          }
        }
      }
    },
    400: basicErrorSchema,
    401: basicErrorSchema,
    404: basicErrorSchema
  }
} as const;
