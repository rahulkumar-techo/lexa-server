import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import { aiGenerateRouteSchema } from "@/src/docs/ai";
import { generateAIHandler } from "./ai.service";

const aiRoute = async (app: FastifyInstance) => {
  app.post(
    "/generate",
    {
      schema: aiGenerateRouteSchema,
      preHandler: [authenticate]
    },
    generateAIHandler
  );
};

export default aiRoute;
