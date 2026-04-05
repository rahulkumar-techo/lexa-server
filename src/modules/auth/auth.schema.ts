
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

export const verifyOtpSchema = z.object({
  token: z.string().min(1),
  otp: z.string().length(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerificationParamsInput = z.infer<typeof verificationParamsSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
