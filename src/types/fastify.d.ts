import { User } from "@/generated/prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: User;
  }
}

export {};
