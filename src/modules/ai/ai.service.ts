import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import { generateAIResponse } from "@/src/lib/ai";
import { aiGenerateSchema } from "./ai.schema";

export const generateAIHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = aiGenerateSchema.parse(req.body);
    const result = await generateAIResponse({
      userId: req.authUser.id,
      chatId: payload.chatId ?? randomUUID(),
      message: payload.message,
      scenario: payload.scenario,
      history: payload.history,
      learningLanguage: payload.learningLanguage,
      nativeLanguage: payload.nativeLanguage,
      level: payload.level
    });

    return responseHandler.success(res, result, "AI response generated successfully");
  }
);
