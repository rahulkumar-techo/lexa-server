import { Queue } from "bullmq";
import { getRedis } from "../redis";
import { QUEUE_NAMES } from "../queue.config";
import { AUTH_EMAIL_JOB_NAME, type AuthEmailJobData } from "../jobs/email-job.types";

let emailQueue: Queue<AuthEmailJobData, void, typeof AUTH_EMAIL_JOB_NAME> | null = null;

export const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = new Queue<AuthEmailJobData, void, typeof AUTH_EMAIL_JOB_NAME>(QUEUE_NAMES.email, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000
        },
        removeOnComplete: 100,
        removeOnFail: false
      }
    });
  }

  return emailQueue;
};

export const closeEmailQueue = async () => {
  await emailQueue?.close();
  emailQueue = null;
};
