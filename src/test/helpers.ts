import { buildApp } from "@/src/app";
import { prisma } from "@/src/lib/prisma";
import { testMailProvider } from "@/src/modules/mails/mail.service";

export const createTestEmail = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

export const cleanupUserByEmail = async (email: string) => {
  await prisma.user.deleteMany({
    where: {
      email
    }
  });
};

export const getLatestSentEmail = (email: string) => {
  const sentEmails = testMailProvider
    .getSentEmails()
    .filter((entry) => entry.email.to.some((recipient) => recipient.email === email));
  const sent = sentEmails[sentEmails.length - 1];

  if (!sent) {
    throw new Error(`No test email found for ${email}`);
  }

  return sent;
};

export const extractFirstUrl = (content: string) => {
  const match = content.match(/https?:\/\/[^\s")]+/);

  if (!match) {
    throw new Error("No URL found in email content");
  }

  return match[0];
};

export const extractOtp = (content: string) => {
  const match = content.match(/\b\d{6}\b/);

  if (!match) {
    throw new Error("No OTP found in email content");
  }

  return match[0];
};

export const registerAndVerifyUser = async (options?: {
  email?: string;
  name?: string;
  password?: string;
  useOtp?: boolean;
}) => {
  const app = await buildApp();
  const email = options?.email ?? createTestEmail("auth");
  const password = options?.password ?? "secret123";
  const name = options?.name ?? "Test User";

  testMailProvider.clear();

  const registerResponse = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      name,
      email,
      password
    }
  });

  const verificationToken = registerResponse.json().data.verificationToken as string;
  const verificationMail = getLatestSentEmail(email);

  const verifyResponse = options?.useOtp
    ? await app.inject({
        method: "POST",
        url: "/api/v1/auth/verify-otp",
        payload: {
          token: verificationToken,
          otp: extractOtp(verificationMail.email.text)
        }
      })
    : await app.inject({
        method: "GET",
        url: `/api/v1/auth/verify?token=${encodeURIComponent(verificationToken)}`
      });

  return {
    app,
    email,
    password,
    name,
    registerResponse,
    verifyResponse
  };
};
