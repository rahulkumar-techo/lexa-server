import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

async function docsPlugin(app: FastifyInstance) {
  await app.register(swagger, {
    transform: ({ schema, url, route }) => {
      const method = Array.isArray(route.method) ? route.method[0] : route.method;
      const nextSchema = structuredClone(schema) as {
        body?: Record<string, unknown>;
        response?: Record<number, Record<string, unknown>>;
      };

      if (method === "GET" && url === "/") {
        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              message: "Fastify TS Server 🚀"
            }
          }
        };
      }

      if (method === "POST" && url === "/api/v1/auth/register") {
        nextSchema.body = {
          ...nextSchema.body,
          example: {
            name: "Rahul Sharma",
            email: "rahul@example.com",
            password: "secret123"
          }
        };

        nextSchema.response = {
          ...nextSchema.response,
          201: {
            ...nextSchema.response?.[201],
            example: {
              success: true,
              message: "User registered successfully. Verify the account to continue.",
              data: {
                user: {
                  id: 1,
                  name: "Rahul Sharma",
                  email: "rahul@example.com",
                  role: "user",
                  status: "INACTIVE",
                  isVerified: false,
                  created_at: "2026-04-04T00:30:06.000Z",
                  email_verified_at: null
                },
                verificationToken: "jwt-token",
                verificationLink: "http://localhost:5000/api/v1/auth/verify?token=jwt-token"
              }
            }
          },
          400: {
            ...nextSchema.response?.[400],
            example: {
              success: false,
              message: "User already registered"
            }
          },
          500: {
            ...nextSchema.response?.[500],
            example: {
              message: "Internal Server Error"
            }
          }
        };
      }

      if (method === "GET" && url === "/api/v1/auth/verify") {
        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              success: true,
              message: "Account verified successfully",
              data: {
                user: {
                  id: 1,
                  name: "Rahul Sharma",
                  email: "rahul@example.com",
                  role: "user",
                  status: "ACTIVE",
                  isVerified: true,
                  created_at: "2026-04-04T00:30:06.000Z",
                  email_verified_at: "2026-04-04T00:35:06.000Z"
                },
                accessToken: "jwt-access-token",
                refreshToken: "jwt-refresh-token",
                tokenType: "Bearer"
              }
            }
          }
        };
      }

      if (method === "POST" && url === "/api/v1/auth/login") {
        nextSchema.body = {
          ...nextSchema.body,
          example: {
            email: "rahul@example.com",
            password: "secret123"
          }
        };

        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              success: true,
              message: "Login successful",
              data: {
                user: {
                  id: 1,
                  name: "Rahul Sharma",
                  email: "rahul@example.com",
                  role: "user",
                  status: "ACTIVE",
                  isVerified: true,
                  created_at: "2026-04-04T00:30:06.000Z",
                  email_verified_at: "2026-04-04T00:35:06.000Z"
                },
                accessToken: "jwt-access-token",
                refreshToken: "jwt-refresh-token",
                tokenType: "Bearer"
              }
            }
          }
        };
      }

      if (method === "POST" && url === "/api/v1/auth/refresh") {
        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              success: true,
              message: "Session refreshed successfully",
              data: {
                user: {
                  id: 1,
                  name: "Rahul Sharma",
                  email: "rahul@example.com",
                  role: "user",
                  status: "ACTIVE",
                  isVerified: true,
                  created_at: "2026-04-04T00:30:06.000Z",
                  email_verified_at: "2026-04-04T00:35:06.000Z"
                },
                accessToken: "jwt-access-token",
                refreshToken: "jwt-refresh-token",
                tokenType: "Bearer"
              }
            }
          }
        };
      }

      if (method === "POST" && url === "/api/v1/auth/logout") {
        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              success: true,
              message: "Logout successful",
              data: {
                clearedCookies: ["accessToken", "refreshToken"]
              }
            }
          }
        };
      }

      if (method === "GET" && url === "/api/v1/preferences/me") {
        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              success: true,
              message: "Preference fetched successfully",
              data: {
                id: 1,
                user_id: 1,
                theme: "system",
                language: "en",
                notifications_enabled: true,
                created_at: "2026-04-04T04:40:00.000Z",
                updated_at: "2026-04-04T04:40:00.000Z"
              }
            }
          }
        };
      }

      if (method === "PUT" && url === "/api/v1/preferences/me") {
        nextSchema.body = {
          ...nextSchema.body,
          example: {
            theme: "dark",
            language: "en",
            notifications_enabled: false
          }
        };

        nextSchema.response = {
          ...nextSchema.response,
          200: {
            ...nextSchema.response?.[200],
            example: {
              success: true,
              message: "Preference updated successfully",
              data: {
                id: 1,
                user_id: 1,
                theme: "dark",
                language: "en",
                notifications_enabled: false,
                created_at: "2026-04-04T04:40:00.000Z",
                updated_at: "2026-04-04T04:41:00.000Z"
              }
            }
          }
        };
      }

      return { schema: nextSchema, url };
    },
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Lexa API",
        description:
          "Production-style API documentation for the Lexa backend built with Fastify, Prisma, and PostgreSQL.",
        version: "1.0.0"
      },
      servers: [
        {
          url: "http://localhost:5000",
          description: "Local development server"
        }
      ],
      tags: [
        {
          name: "Health",
          description: "Basic service availability endpoints"
        },
        {
          name: "Auth",
          description: "Authentication and account creation endpoints"
        },
        {
          name: "Preference",
          description: "Authenticated user preference endpoints"
        }
      ],
      components: {
        schemas: {
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Bad Request" }
            }
          }
        }
      }
    }
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      filter: true
    },
    staticCSP: true,
    transformSpecificationClone: true
  });
}

Object.assign(docsPlugin, {
  [Symbol.for("skip-override")]: true
});

export { docsPlugin };
