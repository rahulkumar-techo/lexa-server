import { z } from "zod";

export const aiHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1)
});

export const aiGenerateSchema = z.object({
  chatId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  scenario: z.string().max(1000).optional(),
  learningLanguage: z.string().min(2).max(50).optional(),
  nativeLanguage: z.string().min(2).max(50).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  history: z.array(aiHistoryMessageSchema).optional()
});

export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;
