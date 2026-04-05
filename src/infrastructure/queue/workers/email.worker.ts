import { Worker } from "bullmq";
import { getDlqQueue } from "../queues/dlq.queue";
import { getRedis } from "../redis";
import { QUEUE_NAMES, queueConfig } from "../queue.config";
import { queueLogger } from "../helpers/queue-logger";
import { AUTH_EMAIL_JOB_NAME, type AuthEmailJobData } from "../jobs/email-job.types";
import { getJobLogContext, processAuthEmailJob } from "../jobs/email.job";

export const createEmailWorker = () => {
  const worker = new Worker<AuthEmailJobData, void, typeof AUTH_EMAIL_JOB_NAME>(
    QUEUE_NAMES.email,
    async (job) => {
      queueLogger.info("processing auth email job", getJobLogContext(job));
      await processAuthEmailJob(job.data);
    },
    {
      connection: getRedis(),
      concurrency: queueConfig.emailWorkerConcurrency
    }
  );

  worker.on("completed", (job) => {
    queueLogger.info("auth email job completed", getJobLogContext(job));
  });

  worker.on("failed", async (job, error) => {
    if (!job) {
      queueLogger.error("auth email job failed without job context", {
        error: error.message
      });
      return;
    }

    const logContext = {
      ...getJobLogContext(job),
      error: error.message
    };

    queueLogger.error("auth email job failed", logContext);

    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade >= maxAttempts) {
      await getDlqQueue().add("dead-letter-email", {
        originalJobId: String(job.id),
        payload: job.data,
        error: error.message,
        failedAt: new Date().toISOString()
      });

      queueLogger.warn("auth email job moved to dlq", logContext);
    }
  });

  return worker;
};
