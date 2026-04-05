import { z } from "zod";

export const createChatSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  scenarioId: z.string().uuid().optional()
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  scenario: z.string().max(1000).optional()
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
