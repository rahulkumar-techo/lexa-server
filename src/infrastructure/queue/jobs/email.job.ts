import { Job } from "bullmq";
import { mailService } from "@/src/modules/mails/mail.service";
import { getRedis } from "../redis";
import { queueConfig } from "../queue.config";
import { authEmailJobSchema } from "./email-job.schema";
import { AUTH_EMAIL_JOB_NAME, type AuthEmailJobData } from "./email-job.types";
import { getEmailQueue } from "../queues/email.queue";
import { queueLogger } from "../helpers/queue-logger";

const getPriority = (job: AuthEmailJobData) => (job.isVip ? 1 : 5);

const getRateLimitKey = (job: AuthEmailJobData) =>
  `queue:email-rate:${job.type}:${String(job.userId ?? job.email).toLowerCase()}`;

const enforcePerUserRateLimit = async (job: AuthEmailJobData) => {
  const redis = getRedis();
  const key = getRateLimitKey(job);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, queueConfig.emailRateLimitWindowSeconds);
  }

  if (count > queueConfig.emailRateLimitMax) {
    throw new Error(`Email queue rate limit exceeded for ${job.email}`);
  }
};

export const processAuthEmailJob = async (payload: AuthEmailJobData) => {
  const job = authEmailJobSchema.parse(payload);

  switch (job.type) {
    case "verification":
      return mailService.sendVerification({
        to: { email: job.email, name: job.name },
        user: {
          firstName: job.name ?? job.email,
          email: job.email
        },
        verificationUrl: job.verificationUrl,
        otp: job.otp
      });

    case "welcome":
      return mailService.sendWelcomeEmail({
        to: { email: job.email, name: job.name },
        user: {
          firstName: job.name ?? job.email
        }
      });

    case "forgot-password":
      return mailService.sendForgotPassword({
        to: { email: job.email, name: job.name },
        user: {
          firstName: job.name ?? job.email,
          email: job.email
        },
        resetUrl: job.resetUrl,
        requestedAt: job.requestedAt ? new Date(job.requestedAt) : undefined,
        ipAddress: job.ipAddress,
        userAgent: job.userAgent
      });

    case "reset-password-confirm":
      return mailService.sendResetPasswordConfirm({
        to: { email: job.email, name: job.name },
        user: {
          firstName: job.name ?? job.email,
          email: job.email
        },
        changedAt: job.changedAt ? new Date(job.changedAt) : undefined,
        ipAddress: job.ipAddress,
        deviceInfo: job.deviceInfo
      });
  }
};

export const enqueueAuthEmailJob = async (payload: AuthEmailJobData) => {
  const job = authEmailJobSchema.parse(payload);

  if (!queueConfig.isQueueExecutionEnabled) {
    queueLogger.info("processing auth email inline", {
      type: job.type,
      email: job.email
    });
    await processAuthEmailJob(job);
    return null;
  }

  await enforcePerUserRateLimit(job);

  const queuedJob = await getEmailQueue().add(AUTH_EMAIL_JOB_NAME, job, {
    priority: getPriority(job)
  });

  queueLogger.info("auth email job queued", {
    jobId: queuedJob.id,
    type: job.type,
    email: job.email,
    priority: getPriority(job)
  });

  return queuedJob;
};

export const getJobLogContext = (job: Job<AuthEmailJobData>) => ({
  jobId: job.id,
  name: job.name,
  attemptsMade: job.attemptsMade,
  emailType: job.data.type,
  email: job.data.email
});
