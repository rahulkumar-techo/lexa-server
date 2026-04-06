import { FastifyInstance } from "fastify";

export type VerificationPurpose = "email-verification" | "password-reset";

export type VerificationTokenPayload = {
  email: string;
  purpose: VerificationPurpose;
  otp?: string;
  passwordHash?: string;
};

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const generateVerificationToken = (
  app: FastifyInstance,
  email: string 
): { token: string; otp: string } => {
  const otp = createOtp();
  const token = app.jwt.sign(
    {
      email,
      purpose: "email-verification",
      otp
    },
    { expiresIn: "15m" }
  );

  return { token, otp };
};

export const generatePasswordResetToken = (
  app: FastifyInstance,
  email: string,
  passwordHash: string
): { token: string } => {
  const token = app.jwt.sign(
    {
      email,
      purpose: "password-reset",
      passwordHash
    },
    { expiresIn: "15m" }
  );

  return { token };
};

export const verifyVerificationToken = (
  app: FastifyInstance,
  token: string
): VerificationTokenPayload => {
  return app.jwt.verify(token) as VerificationTokenPayload;
};
