import { Queue } from "bullmq";
import { getRedis } from "../redis";
import { QUEUE_NAMES } from "../queue.config";
import { type AuthEmailJobData } from "../jobs/email-job.types";

export type DeadLetterEmailJob = {
  originalJobId?: string;
  payload: AuthEmailJobData;
  error: string;
  failedAt: string;
};

let dlqQueue: Queue<DeadLetterEmailJob> | null = null;

export const getDlqQueue = () => {
  if (!dlqQueue) {
    dlqQueue = new Queue<DeadLetterEmailJob>(QUEUE_NAMES.deadLetter, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: false
      }
    });
  }

  return dlqQueue;
};

export const closeDlqQueue = async () => {
  await dlqQueue?.close();
  dlqQueue = null;
};
