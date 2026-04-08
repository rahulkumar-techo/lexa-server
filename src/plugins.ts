import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import { env } from "./config/env";

const DEFAULT_DEV_CORS_ORIGINS = [
  env.APP_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const allowedOrigins =
  env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : DEFAULT_DEV_CORS_ORIGINS;

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

const getSafeUrl = (url: string) => {
  const parsedUrl = new URL(url, env.APP_URL);

  if (parsedUrl.searchParams.has("token")) {
    parsedUrl.searchParams.set("token", "[redacted]");
  }

  const search = parsedUrl.searchParams.toString();
  return `${parsedUrl.pathname}${search ? `?${search}` : ""}`;
};

export async function registerPlugins(app: FastifyInstance) {
  await app.register(helmet);

  await app.register(cors, {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"), false);
    },
    credentials: true
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  await app.register(cookie);

  app.addHook("onRequest", async (req: FastifyRequest) => {
    req.log.info({ method: req.method, url: getSafeUrl(req.url) });
  });

  app.addHook("onResponse", async (req: FastifyRequest, reply: FastifyReply) => {
    req.log.info({ statusCode: reply.statusCode });
  });
}
