import { z } from "zod";

export const createAnalyticsEventSchema = z.object({
  event: z.string().min(2).max(100),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type CreateAnalyticsEventInput = z.infer<typeof createAnalyticsEventSchema>;
