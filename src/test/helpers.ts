import { buildApp } from "@/src/app";
import { prisma } from "@/src/lib/prisma";

export const createTestEmail = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

export const cleanupUserByEmail = async (email: string) => {
  await prisma.user.deleteMany({
    where: {
      email
    }
  });
};

export const registerAndVerifyUser = async (options?: {
  email?: string;
  name?: string;
  password?: string;
}) => {
  const app = await buildApp();
  const email = options?.email ?? createTestEmail("auth");
  const password = options?.password ?? "secret123";
  const name = options?.name ?? "Test User";

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

  const verifyResponse = await app.inject({
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
