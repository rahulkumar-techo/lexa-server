const publicUserSchema = {
  type: "object",
  required: ["id", "email", "role", "status", "isVerified", "created_at"],
  properties: {
    id: {
      type: "string",
      format: "uuid"
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

const successOnlySchema = {
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

export const verifyOtpBodySchema = {
  type: "object",
  required: ["token", "otp"],
  properties: {
    token: {
      type: "string"
    },
    otp: {
      type: "string",
      minLength: 6,
      maxLength: 6
    }
  }
} as const;

export const forgotPasswordBodySchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: {
      type: "string",
      format: "email"
    }
  }
} as const;

export const resetPasswordBodySchema = {
  type: "object",
  required: ["token", "password"],
  properties: {
    token: {
      type: "string"
    },
    password: {
      type: "string",
      minLength: 6
    }
  }
} as const;

export const registerRouteSchema = {
  tags: ["Auth"],
  summary: "Register a new user",
  description:
    "Creates an inactive user and sends a verification email. Test runs may also include debug verification fields.",
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
          required: ["user", "mailProvider"],
          properties: {
            user: publicUserSchema,
            verificationToken: {
              type: "string"
            },
            verificationLink: {
              type: "string"
            },
            mailProvider: {
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
  summary: "Verify a newly registered user by link token",
  description: "Validates the verification token, activates the account, and returns auth tokens.",
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

export const verifyOtpRouteSchema = {
  tags: ["Auth"],
  summary: "Verify a newly registered user by OTP",
  description: "Validates the OTP embedded in the verification token and activates the account.",
  body: verifyOtpBodySchema,
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

export const forgotPasswordRouteSchema = {
  tags: ["Auth"],
  summary: "Request a password reset email",
  description: "Sends a reset password email when the account exists. Always returns a generic success message.",
  body: forgotPasswordBodySchema,
  response: {
    200: successOnlySchema,
    500: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    }
  }
} as const;

export const resetPasswordRouteSchema = {
  tags: ["Auth"],
  summary: "Reset password using reset token",
  description: "Validates the reset token, updates the password, clears sessions, and sends a confirmation email.",
  body: resetPasswordBodySchema,
  response: {
    200: successOnlySchema,
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
