const publicUserSchema = {
  type: "object",
  required: ["id", "email", "role", "status", "isVerified", "created_at"],
  properties: {
    id: {
      type: "integer"
    },
    name: {
      type: "string",
      minLength: 3,
      maxLength: 50,
      nullable: true
    },
    email: {
      type: "string",
      format: "email"
    },
    role: {
      type: "string"
    },
    status: {
      type: "string",
      enum: ["ACTIVE", "INACTIVE", "BANNED"]
    },
    isVerified: {
      type: "boolean"
    },
    created_at: {
      type: "string",
      format: "date-time"
    },
    email_verified_at: {
      type: "string",
      format: "date-time",
      nullable: true
    }
  }
} as const;

const authTokenSchema = {
  type: "object",
  required: ["user", "accessToken", "refreshToken", "tokenType"],
  properties: {
    user: publicUserSchema,
    accessToken: {
      type: "string"
    },
    refreshToken: {
      type: "string"
    },
    tokenType: {
      type: "string",
      enum: ["Bearer"]
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

export const registerBodySchema = {
  type: "object",
  required: ["name", "email", "password"],
  properties: {
    name: {
      type: "string",
      minLength: 3,
      maxLength: 50
    },
    email: {
      type: "string",
      format: "email"
    },
    password: {
      type: "string",
      minLength: 6
    }
  }
} as const;

export const loginBodySchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: {
      type: "string",
      format: "email"
    },
    password: {
      type: "string",
      minLength: 6
    }
  }
} as const;

export const verifyQuerySchema = {
  type: "object",
  required: ["token"],
  properties: {
    token: {
      type: "string"
    }
  }
} as const;

export const registerRouteSchema = {
  tags: ["Auth"],
  summary: "Register a new user",
  description: "Creates an inactive unverified user and returns a verification link for development.",
  body: registerBodySchema,
  response: {
    201: {
      description: "User registered successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          required: ["user", "verificationToken", "verificationLink"],
          properties: {
            user: publicUserSchema,
            verificationToken: {
              type: "string"
            },
            verificationLink: {
              type: "string"
            }
          }
        }
      }
    },
    400: basicErrorSchema,
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;

export const verifyRouteSchema = {
  tags: ["Auth"],
  summary: "Verify a newly registered user",
  description: "Validates the verification token, activates the account, and returns an access token.",
  querystring: verifyQuerySchema,
  response: {
    200: {
      description: "Account verified successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: authTokenSchema
      }
    },
    400: basicErrorSchema,
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

export const loginRouteSchema = {
  tags: ["Auth"],
  summary: "Login with email and password",
  description: "Authenticates a verified local user and returns a bearer token.",
  body: loginBodySchema,
  response: {
    200: {
      description: "Login successful",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: authTokenSchema
      }
    },
    400: basicErrorSchema,
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

export const refreshRouteSchema = {
  tags: ["Auth"],
  summary: "Refresh access and refresh tokens",
  description: "Reads the refresh token from the cookie, rotates the auth session, and resets cookies.",
  response: {
    200: {
      description: "Session refreshed successfully",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: authTokenSchema
      }
    },
    401: basicErrorSchema,
    403: basicErrorSchema,
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

export const logoutRouteSchema = {
  tags: ["Auth"],
  summary: "Logout current user",
  description: "Clears access and refresh token cookies.",
  response: {
    200: {
      description: "Logout successful",
      type: "object",
      required: ["success", "message", "data"],
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          required: ["clearedCookies"],
          properties: {
            clearedCookies: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
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
