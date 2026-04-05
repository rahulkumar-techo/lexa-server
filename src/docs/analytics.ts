const analyticsEventSchema = {
  type: "object",
  required: ["id", "user_id", "event", "created_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "integer" },
    event: { type: "string" },
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

export const createAnalyticsEventBodySchema = {
  type: "object",
  required: ["event"],
  properties: {
    event: { type: "string", minLength: 2, maxLength: 100 },
    metadata: {
      type: "object",
      additionalProperties: true
    }
  },
  additionalProperties: false
} as const;

export const createAnalyticsEventRouteSchema = {
  tags: ["Analytics"],
  summary: "Track event",
  body: createAnalyticsEventBodySchema,
  response: {
    201: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: analyticsEventSchema
      }
    },
    401: basicErrorSchema
  }
} as const;

export const getUserAnalyticsRouteSchema = {
  tags: ["Analytics"],
  summary: "Get user stats",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "integer" }
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
          type: "object",
          required: ["totalEvents", "recentEvents"],
          properties: {
            totalEvents: { type: "integer" },
            recentEvents: {
              type: "array",
              items: analyticsEventSchema
            }
          }
        }
      }
    },
    401: basicErrorSchema,
    403: basicErrorSchema
  }
} as const;
