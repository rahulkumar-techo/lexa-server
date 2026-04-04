import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
export async function registerPlugins(app: FastifyInstance) {
  await app.register(helmet);

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  await app.register(fastifyJwt, {
    secret: "supersecret"
  });

  await app.register(cookie);

  app.addHook("onRequest", async (req: FastifyRequest) => {
    req.log.info({ method: req.method, url: req.url });
  });

  app.addHook("onResponse", async (req: FastifyRequest, reply: FastifyReply) => {
    req.log.info({ statusCode: reply.statusCode });
  });
}
