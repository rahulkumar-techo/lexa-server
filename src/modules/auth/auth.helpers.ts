import type { FastifyRequest } from "fastify";
import type { User } from "@/generated/prisma/client";
import { env } from "@/src/config/env";

export const toPublicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role.toLowerCase(),
  status: user.status,
  isVerified: user.isVerified,
  created_at: user.createdAt,
  email_verified_at: user.emailVerifiedAt
});

export const isAdminRole = (role: User["role"]) => role === "ADMIN";

export const getRequestOrigin = (req: FastifyRequest) => {
  const host = req.headers.host ?? `localhost:${env.PORT}`;
  const protocol = req.protocol ?? "http";

  return `${protocol}://${host}`;
};

export const getSingleHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
