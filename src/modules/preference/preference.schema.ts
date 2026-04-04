import { z } from "zod";

export const updatePreferenceSchema = z.object({
  theme: z.string().min(2).max(20).optional(),
  language: z.string().min(2).max(10).optional(),
  notifications_enabled: z.boolean().optional()
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
