const subscriptionSchema = {
  type: "object",
  required: ["id", "user_id", "provider", "status", "created_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    provider: { type: "string" },
    status: { type: "string" },
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

export const createSubscriptionBodySchema = {
  type: "object",
  required: ["provider"],
  properties: {
    provider: { type: "string", minLength: 2, maxLength: 50 },
    status: { type: "string", minLength: 2, maxLength: 50 }
  },
  additionalProperties: false
} as const;

export const paymentWebhookBodySchema = {
  type: "object",
  required: ["userId", "provider", "status"],
  properties: {
    userId: { type: "string", format: "uuid" },
    provider: { type: "string", minLength: 2, maxLength: 50 },
    status: { type: "string", minLength: 2, maxLength: 50 }
  },
  additionalProperties: false
} as const;

export const createSubscriptionRouteSchema = {
  tags: ["Payment"],
  summary: "Create subscription",
  body: createSubscriptionBodySchema,
  response: {
    201: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: subscriptionSchema
      }
    },
    401: basicErrorSchema
  }
} as const;

export const paymentWebhookRouteSchema = {
  tags: ["Payment"],
  summary: "Verify payment webhook",
  body: paymentWebhookBodySchema,
  response: {
    200: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: subscriptionSchema
      }
    },
    400: basicErrorSchema,
    404: basicErrorSchema
  }
} as const;
