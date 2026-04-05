import type { FastifyInstance } from "fastify";
import { closeEmailQueue } from "./queues/email.queue";
import { closeDlqQueue } from "./queues/dlq.queue";
import { createEmailWorker } from "./workers/email.worker";
import { closeRedis } from "./redis";
import { registerBullBoard } from "./monitors/bull-board";
import { queueConfig } from "./queue.config";
import { queueLogger } from "./helpers/queue-logger";

let emailWorker: ReturnType<typeof createEmailWorker> | null = null;

export const registerQueueMonitoring = async (app: FastifyInstance) => {
  if (!queueConfig.isQueueExecutionEnabled) {
    return;
  }

  await registerBullBoard(app);
};

export const startQueueWorkers = async () => {
  if (!queueConfig.isQueueExecutionEnabled || emailWorker) {
    return;
  }

  emailWorker = createEmailWorker();
  queueLogger.info("queue workers started", {
    concurrency: queueConfig.emailWorkerConcurrency
  });
};

export const stopQueueInfrastructure = async () => {
  await emailWorker?.close();
  emailWorker = null;
  await Promise.all([closeEmailQueue(), closeDlqQueue()]);
  await closeRedis();
  queueLogger.info("queue infrastructure stopped");
};
