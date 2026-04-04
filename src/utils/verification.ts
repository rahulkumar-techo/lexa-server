import { FastifyInstance } from "fastify";

type VerificationTokenPayload = {
  email: string;
  purpose: "email-verification";
};

export const generateVerificationToken = (
  app: FastifyInstance,
  email: string
): { token: string } => {
  const token = app.jwt.sign(
    {
      email,
      purpose: "email-verification"
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
