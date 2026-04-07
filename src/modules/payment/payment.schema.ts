import { z } from "zod";

export const createSubscriptionSchema = z.object({
  provider: z.string().min(2).max(50),
  status: z.string().min(2).max(50).default("active")
});

export const paymentWebhookSchema = z.object({
  userId: z.string().uuid(),
  provider: z.string().min(2).max(50),
  status: z.string().min(2).max(50)
});
