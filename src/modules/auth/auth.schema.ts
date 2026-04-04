
import { string, z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: string().min(3).max(50)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const verificationParamsSchema = z.object({
  token: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerificationParamsInput = z.infer<typeof verificationParamsSchema>;
