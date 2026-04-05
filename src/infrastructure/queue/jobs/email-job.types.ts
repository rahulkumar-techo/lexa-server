export const AUTH_EMAIL_JOB_NAME = "auth-email";

export type AuthEmailJobType =
  | "verification"
  | "welcome"
  | "forgot-password"
  | "reset-password-confirm";

type BaseAuthEmailJob = {
  type: AuthEmailJobType;
  email: string;
  name?: string;
  userId?: number | string;
  isVip?: boolean;
  requestId?: string;
};

export type VerificationEmailJob = BaseAuthEmailJob & {
  type: "verification";
  verificationUrl: string;
  otp?: string;
};

export type WelcomeEmailJob = BaseAuthEmailJob & {
  type: "welcome";
};

export type ForgotPasswordEmailJob = BaseAuthEmailJob & {
  type: "forgot-password";
  resetUrl: string;
  requestedAt?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ResetPasswordConfirmEmailJob = BaseAuthEmailJob & {
  type: "reset-password-confirm";
  changedAt?: string;
  ipAddress?: string;
  deviceInfo?: string;
};

export type AuthEmailJobData =
  | VerificationEmailJob
  | WelcomeEmailJob
  | ForgotPasswordEmailJob
  | ResetPasswordConfirmEmailJob;
