// Build Fastify app (minimal + clean)

import Fastify from "fastify";
import { registerPlugins } from "./plugins";
import authRoute from "./modules/auth/auth.route";
import { docsPlugin } from "./lib/docs";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname"
        }
      }
    }
  });

  await registerPlugins(app);
  await docsPlugin(app);

  app.get(
    "/",
    {
      schema: {
        tags: ["Health"],
        summary: "Health check",
        description: "Confirms the API server is running.",
        response: {
          200: {
            type: "object",
            required: ["message"],
            properties: {
              message: { type: "string" }
            }
          }
        }
      }
    },
    async () => {
      return { message: "Fastify TS Server 🚀" };
    }
  );

  await app.register(authRoute, { prefix: "/api/v1/auth" });

  return app;
}
