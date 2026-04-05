import { buildApp } from "./app";
import { env } from "./config/env";
import { startQueueWorkers, stopQueueInfrastructure } from "./infrastructure/queue";

const start = async () => {
  try {
    const app = await buildApp(); // create app instance
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

    app.log.info(`Server running on http://localhost:${env.PORT}`); // log startup
  } catch (err) {
    console.error(err); // fallback error log
    process.exit(1); // exit process
  }
};

start();
