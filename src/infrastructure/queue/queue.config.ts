import { env } from "@/src/config/env";

export const QUEUE_NAMES = {
  email: "email-queue",
  deadLetter: "email-dlq"
} as const;

const isTestRuntime =
  env.NODE_ENV === "test" ||
  process.argv.includes("--test") ||
  process.argv.some((arg) => arg.includes(".test.")) ||
  process.env.npm_lifecycle_event === "test";

export const queueConfig = {
  redisUrl: env.REDIS_URL,
  emailWorkerConcurrency: env.QUEUE_EMAIL_WORKER_CONCURRENCY,
  emailRateLimitMax: env.QUEUE_EMAIL_RATE_LIMIT_MAX,
  emailRateLimitWindowSeconds: env.QUEUE_EMAIL_RATE_LIMIT_WINDOW_SECONDS,
  isQueueExecutionEnabled: !isTestRuntime
};
