// Description: Centralized environment configuration (clean & consistent)

import "dotenv/config";

// Types
type NodeEnvironment = "development" | "test" | "production";

const NODE_ENV = (process.env.NODE_ENV ?? "development") as NodeEnvironment;
const isDevelopment = NODE_ENV === "development";
const PORT = Number(process.env.PORT ?? 5000);
const APP_URL = process.env.APP_URL ?? `http://localhost:${PORT}`;

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:root@localhost:5432/lexadb?schema=public";
const DEFAULT_REDIS_URL = "redis://127.0.0.1:6379";
const DEFAULT_JWT_SECRET = "lexa-dev-secret";

const parseCsv = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const resolveJwtSecret = () => {
  const jwtSecret =
    process.env.JWT_SECRET ?? (isDevelopment ? DEFAULT_JWT_SECRET : undefined);

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required outside development");
  }

  return jwtSecret;
};

export const env = {
  NODE_ENV,

  // App
  PORT,
  APP_NAME: process.env.APP_NAME ?? "Lexa",
  APP_URL,
  JWT_SECRET: resolveJwtSecret(),
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),

  // Database
  DATABASE_URL: isDevelopment
    ? DEFAULT_DATABASE_URL
    : process.env.DATABASE_URL ?? process.env.DB_URL ?? "",

  // Redis
  REDIS_URL: isDevelopment
    ? DEFAULT_REDIS_URL
    : process.env.REDIS_URL ?? process.env.UPSTASH_URL ?? "",

  // AI
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  GROQ_MODEL: process.env.GROQ_MODEL ?? "llama3-70b-8192",

  // Mail
  APP_PASSWORD: process.env.APP_PASSWORD ?? "",
  NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL ?? "",

  // Queue
  QUEUE_EMAIL_WORKER_CONCURRENCY: Number(
    process.env.QUEUE_EMAIL_WORKER_CONCURRENCY ?? 5
  ),
  QUEUE_EMAIL_RATE_LIMIT_MAX: Number(
    process.env.QUEUE_EMAIL_RATE_LIMIT_MAX ?? 10
  ),
  QUEUE_EMAIL_RATE_LIMIT_WINDOW_SECONDS: Number(
    process.env.QUEUE_EMAIL_RATE_LIMIT_WINDOW_SECONDS ?? 60
  ),
};
