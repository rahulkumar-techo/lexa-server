import { z } from "zod";

export const updatePreferenceSchema = z.object({
  theme: z.string().min(2).max(20).optional(),
  language: z.string().min(2).max(10).optional(),
  learning_language: z.string().min(2).max(50).optional(),
  native_language: z.string().min(2).max(50).optional(),
  learning_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  notifications_enabled: z.boolean().optional()
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
