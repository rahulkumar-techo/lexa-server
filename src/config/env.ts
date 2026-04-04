type NodeEnvironment = "development" | "test" | "production";

export const env = {
  NODE_ENV: (process.env.NODE_ENV ?? "development") as NodeEnvironment,
  PORT: Number(process.env.PORT ?? 5000),
  groq_api_key: String(process.env.GROQ_API_KEY),
  GROQ_MODEL: process.env.GROQ_MODEL
};
