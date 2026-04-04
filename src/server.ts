import { buildApp } from "./app";
import { env } from "./config/env";

const start = async () => {
  try {
    const app = await buildApp(); // create app instance

    await app.listen({ port: env.PORT });

    app.log.info(`Server running on http://localhost:${env.PORT}`); // log startup
  } catch (err) {
    console.error(err); // fallback error log
    process.exit(1); // exit process
  }
};

start();
