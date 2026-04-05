const basicErrorSchema = {
  type: "object",
  required: ["success", "message"],
  properties: {
    success: { type: "boolean" },
    message: { type: "string" }
  }
} as const;

export const aiGenerateBodySchema = {
  type: "object",
  required: ["message"],
  properties: {
    chatId: { type: "string", format: "uuid" },
    message: { type: "string", minLength: 1, maxLength: 4000 },
    scenario: { type: "string", maxLength: 1000 },
    learningLanguage: { type: "string", minLength: 2, maxLength: 50 },
    nativeLanguage: { type: "string", minLength: 2, maxLength: 50 },
    level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
    history: {
      type: "array",
      items: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" }
        }
      }
    }
  },
  additionalProperties: false
} as const;

export const aiGenerateRouteSchema = {
  tags: ["AI"],
  summary: "Generate AI response",
  body: aiGenerateBodySchema,
  response: {
    200: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          required: ["reply"],
          properties: {
            reply: { type: "string" },
            usage: {
              type: "object",
              nullable: true,
              additionalProperties: true
            }
          }
        }
      }
    },
    400: basicErrorSchema,
    401: basicErrorSchema
  }
} as const;
