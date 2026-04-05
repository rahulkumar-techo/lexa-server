import IORedis from "ioredis";
import { queueConfig } from "./queue.config";
import { queueLogger } from "./helpers/queue-logger";

let redisClient: IORedis | null = null;

const createRedisConnection = (connectionName: string) => {
  const usesTls = queueConfig.redisUrl.startsWith("rediss://");

  const client = new IORedis(queueConfig.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(usesTls ? { tls: {} } : {})
  });

  client.on("connect", () => {
    queueLogger.info("redis connecting", { connectionName });
  });

  client.on("ready", () => {
    queueLogger.info("redis ready", { connectionName });
  });

  client.on("error", (error) => {
    queueLogger.error("redis error", {
      connectionName,
      error: error.message
    });
  });

  client.on("close", () => {
    queueLogger.warn("redis connection closed", { connectionName });
  });

  return client;
};

export const getRedis = () => {
  if (!redisClient) {
    redisClient = createRedisConnection("queue-primary");
  }

  return redisClient;
};

export const closeRedis = async () => {
  if (!redisClient) {
    return;
  }

  await redisClient.quit();
  redisClient = null;
};
