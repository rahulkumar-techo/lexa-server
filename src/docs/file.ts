const fileSchema = {
  type: "object",
  required: ["id", "user_id", "url", "type", "created_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    user_id: { type: "string", format: "uuid" },
    url: { type: "string" },
    type: { type: "string" },
    size: { type: "integer", nullable: true },
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

export const uploadFileBodySchema = {
  type: "object",
  required: ["url", "type"],
  properties: {
    url: { type: "string", minLength: 5, maxLength: 255 },
    type: { type: "string", minLength: 2, maxLength: 50 },
    size: { type: "integer", minimum: 0 }
  },
  additionalProperties: false
} as const;

export const uploadFileRouteSchema = {
  tags: ["File"],
  summary: "Upload file metadata",
  body: uploadFileBodySchema,
  response: {
    201: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: fileSchema
      }
    },
    401: basicErrorSchema
  }
} as const;
