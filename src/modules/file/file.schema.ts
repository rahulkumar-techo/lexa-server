import { z } from "zod";

export const uploadFileSchema = z.object({
  url: z.string().min(5).max(255),
  type: z.string().min(2).max(50),
  size: z.number().int().nonnegative().optional()
});
