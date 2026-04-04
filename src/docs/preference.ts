const preferenceDataSchema = {
  type: "object",
  required: [
    "id",
    "user_id",
    "notifications_enabled",
    "created_at",
    "updated_at"
  ],
  properties: {
    id: {
      type: "integer"
    },
    user_id: {
      type: "integer"
    },
    theme: {
      type: "string",
      nullable: true
    },
    language: {
      type: "string",
      nullable: true
    },
    learning_language: {
      type: "string",
      nullable: true
    },
    native_language: {
      type: "string",
      nullable: true
    },
    learning_level: {
      type: "string",
      enum: ["beginner", "intermediate", "advanced"],
      nullable: true
    },
    notifications_enabled: {
      type: "boolean"
    },
    created_at: {
      type: "string",
      format: "date-time"
    },
    updated_at: {
      type: "string",
      format: "date-time"
    }
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

export const updatePreferenceBodySchema = {
  type: "object",
  properties: {
    theme: {
      type: "string",
      minLength: 2,
      maxLength: 20
    },
    language: {
      type: "string",
      minLength: 2,
      maxLength: 10
    },
    learning_language: {
      type: "string",
      minLength: 2,
      maxLength: 50
    },
    native_language: {
      type: "string",
      minLength: 2,
      maxLength: 50
    },
    learning_level: {
      type: "string",
      enum: ["beginner", "intermediate", "advanced"]
    },
    notifications_enabled: {
      type: "boolean"
    }
  },
  additionalProperties: false
} as const;

export const getPreferenceRouteSchema = {
  tags: ["Preference"],
  summary: "Get current user preference",
  description: "Returns the authenticated user's preference. Creates a default preference if it does not exist.",
  response: {
    200: {
      description: "Preference fetched successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: preferenceDataSchema
      }
    },
    401: basicErrorSchema,
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;

export const updatePreferenceRouteSchema = {
  tags: ["Preference"],
  summary: "Update current user preference",
  description: "Updates the authenticated user's preference record.",
  body: updatePreferenceBodySchema,
  response: {
    200: {
      description: "Preference updated successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: preferenceDataSchema
      }
    },
    400: basicErrorSchema,
    401: basicErrorSchema,
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;
