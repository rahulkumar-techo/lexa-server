import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    avatar_url: z.string().min(5).max(255).optional(),
    bio: z.string().min(2).max(500).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one user field is required"
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
