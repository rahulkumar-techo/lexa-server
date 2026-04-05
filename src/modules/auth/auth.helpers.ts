import type { FastifyRequest } from "fastify";
import type { User } from "@/generated/prisma/client";
import { env } from "@/src/config/env";

export const toPublicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  isVerified: user.is_verified,
  created_at: user.created_at,
  email_verified_at: user.email_verified_at
});

export const getRequestOrigin = (req: FastifyRequest) => {
  const host = req.headers.host ?? `localhost:${env.PORT}`;
  const protocol = req.protocol ?? "http";

  return `${protocol}://${host}`;
};

export const getSingleHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
