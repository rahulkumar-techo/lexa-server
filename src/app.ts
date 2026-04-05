// Build Fastify app (minimal + clean)

import Fastify from "fastify";
import { registerPlugins } from "./plugins";
import authRoute from "./modules/auth/auth.route";
import preferenceRoute from "./modules/preference/preference.route";
import scenarioRoute from "./modules/scenario/scenario.route";
import userRoute from "./modules/user/user.route";
import chatRoute from "./modules/chat/chat.route";
import aiRoute from "./modules/ai/ai.route";
import analyticsRoute from "./modules/analytics/analytics.route";
import paymentRoute from "./modules/payment/payment.route";
import fileRoute from "./modules/file/file.route";
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
  await app.register(userRoute, { prefix: "/api/v1/users" });
  await app.register(preferenceRoute, { prefix: "/api/v1/preferences" });
  await app.register(scenarioRoute, { prefix: "/api/v1/scenarios" });
  await app.register(chatRoute, { prefix: "/api/v1/chats" });
  await app.register(aiRoute, { prefix: "/api/v1/ai" });
  await app.register(analyticsRoute, { prefix: "/api/v1/analytics" });
  await app.register(paymentRoute, { prefix: "/api/v1/payments" });
  await app.register(fileRoute, { prefix: "/api/v1/files" });

  return app;
}
