import { buildApp } from "./app";
import { env } from "./config/env";
import { startQueueWorkers, stopQueueInfrastructure } from "./infrastructure/queue";
import { registerChatSocket } from "./ws/chat.socket";
import { attachWebSocketServer } from "./ws/ws.server";

const start = async () => {
  try {
    const app = await buildApp();
    const wss = attachWebSocketServer(app.server);

    registerChatSocket(app, wss);
    await startQueueWorkers();

    const shutdown = async (signal: NodeJS.Signals) => {
      app.log.info({ signal }, "Shutting down gracefully");
      await app.close();
      await stopQueueInfrastructure();
      process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    await app.listen({ port: env.PORT });
    app.log.info(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
