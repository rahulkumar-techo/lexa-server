import preferenceRepo from "./preference.repo";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import { FastifyReply, FastifyRequest } from "fastify";
import { updatePreferenceSchema } from "./preference.schema";

const ensureAuthenticatedUserId = (req: FastifyRequest) => {
  if (!req.authUser) {
    throw new Error("Unauthorized");
  }

  return req.authUser.id;
};

const buildDefaultPreference = (userId: number) => ({
  user_id: userId,
  theme: "system",
  language: "en",
  learning_language: "English",
  native_language: "English",
  learning_level: "beginner" as const,
  notifications_enabled: true
});

export const getMyPreference = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const userId = ensureAuthenticatedUserId(req);

    let preference = await preferenceRepo.getPreferenceByUserId(userId);

    if (!preference) {
      preference = await preferenceRepo.createPreference(buildDefaultPreference(userId));
    }

    return responseHandler.success(res, preference, "Preference fetched successfully");
  }
);

export const upsertMyPreference = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const userId = ensureAuthenticatedUserId(req);
    const payload = updatePreferenceSchema.parse(req.body);

    if (Object.keys(payload).length === 0) {
      return responseHandler.badRequest(res, "At least one preference field is required");
    }

    const preference = await preferenceRepo.upsertPreference(
      userId,
      {
        ...buildDefaultPreference(userId),
        ...payload
      },
      payload
    );

    return responseHandler.success(res, preference, "Preference updated successfully");
  }
);
