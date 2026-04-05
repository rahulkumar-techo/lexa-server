import { z } from "zod";

const baseEmailJobSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  userId: z.union([z.number().int().positive(), z.string().min(1)]).optional(),
  isVip: z.boolean().optional(),
  requestId: z.string().min(1).optional()
});

export const authEmailJobSchema = z.discriminatedUnion("type", [
  baseEmailJobSchema.extend({
    type: z.literal("verification"),
    verificationUrl: z.string().url(),
    otp: z.string().length(6).optional()
  }),
  baseEmailJobSchema.extend({
    type: z.literal("welcome")
  }),
  baseEmailJobSchema.extend({
    type: z.literal("forgot-password"),
    resetUrl: z.string().url(),
    requestedAt: z.string().datetime().optional(),
    ipAddress: z.string().min(1).optional(),
    userAgent: z.string().min(1).optional()
  }),
  baseEmailJobSchema.extend({
    type: z.literal("reset-password-confirm"),
    changedAt: z.string().datetime().optional(),
    ipAddress: z.string().min(1).optional(),
    deviceInfo: z.string().min(1).optional()
  })
]);
