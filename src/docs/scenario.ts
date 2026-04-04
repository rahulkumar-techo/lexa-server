const scenarioDataSchema = {
  type: "object",
  required: ["id", "title", "config", "created_at"],
  properties: {
    id: {
      type: "string",
      format: "uuid"
    },
    title: {
      type: "string"
    },
    description: {
      type: "string",
      nullable: true
    },
    config: {
      type: "object",
      additionalProperties: true
    },
    created_at: {
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

export const createScenarioBodySchema = {
  type: "object",
  required: ["title", "config"],
  properties: {
    title: {
      type: "string",
      minLength: 2,
      maxLength: 100
    },
    description: {
      type: "string",
      maxLength: 500
    },
    config: {
      type: "object",
      additionalProperties: true
    }
  },
  additionalProperties: false
} as const;

export const getScenariosRouteSchema = {
  tags: ["Scenario"],
  summary: "Get all scenarios",
  description: "Returns the full list of learning scenarios.",
  response: {
    200: {
      description: "Scenarios fetched successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "array",
          items: scenarioDataSchema
        }
      }
    },
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;

export const getScenarioDetailRouteSchema = {
  tags: ["Scenario"],
  summary: "Get scenario detail",
  description: "Returns a single scenario by id.",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        format: "uuid"
      }
    }
  },
  response: {
    200: {
      description: "Scenario fetched successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: scenarioDataSchema
      }
    },
    404: basicErrorSchema,
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;

export const createScenarioRouteSchema = {
  tags: ["Scenario"],
  summary: "Create scenario",
  description: "Creates a new scenario. Admin access required.",
  body: createScenarioBodySchema,
  response: {
    201: {
      description: "Scenario created successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: scenarioDataSchema
      }
    },
    401: basicErrorSchema,
    403: basicErrorSchema,
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;
