const publicProfileSchema = {
  type: "object",
  required: ["id", "email", "role", "status", "is_verified", "created_at", "updated_at"],
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    name: { type: "string", nullable: true },
    avatar_url: { type: "string", nullable: true },
    bio: { type: "string", nullable: true },
    role: { type: "string" },
    status: {
      type: "string",
      enum: ["ACTIVE", "INACTIVE", "BANNED"]
    },
    is_verified: { type: "boolean" },
    email_verified_at: { type: "string", format: "date-time", nullable: true },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" }
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

export const updateUserBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 2, maxLength: 50 },
    avatar_url: { type: "string", minLength: 5, maxLength: 255 },
    bio: { type: "string", minLength: 2, maxLength: 500 }
  },
  additionalProperties: false
} as const;

export const getUserRouteSchema = {
  tags: ["User"],
  summary: "Get user profile",
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
        data: publicProfileSchema
      }
    },
    401: basicErrorSchema,
    403: basicErrorSchema,
    404: basicErrorSchema
  }
} as const;

export const updateUserRouteSchema = {
  tags: ["User"],
  summary: "Update user profile",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid" }
    }
  },
  body: updateUserBodySchema,
  response: {
    200: {
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: publicProfileSchema
      }
    },
    400: basicErrorSchema,
    401: basicErrorSchema,
    403: basicErrorSchema,
    404: basicErrorSchema
  }
} as const;
