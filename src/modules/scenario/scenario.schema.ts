import { z } from "zod";

export const createScenarioSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  config: z.record(z.string(), z.unknown())
});

export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
