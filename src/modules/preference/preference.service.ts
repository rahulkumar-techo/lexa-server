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

const buildDefaultPreference = (userId: string) => ({
  userId,
  theme: "system",
  language: "en",
  learningLanguage: "English",
  nativeLanguage: "English",
  learningLevel: "beginner" as const,
  notificationsEnabled: true
});

const mapPreferencePayloadToPrisma = (payload: ReturnType<typeof updatePreferenceSchema.parse>) => ({
  theme: payload.theme,
  language: payload.language,
  learningLanguage: payload.learning_language,
  nativeLanguage: payload.native_language,
  learningLevel: payload.learning_level,
  notificationsEnabled: payload.notifications_enabled
});

const toPreferenceResponse = (
  preference: Awaited<ReturnType<typeof preferenceRepo.getPreferenceByUserId>> extends infer T
    ? Exclude<T, null>
    : never
) => ({
  id: preference.id,
  user_id: preference.userId,
  theme: preference.theme,
  language: preference.language,
  learning_language: preference.learningLanguage,
  native_language: preference.nativeLanguage,
  learning_level: preference.learningLevel,
  notifications_enabled: preference.notificationsEnabled,
  created_at: preference.createdAt,
  updated_at: preference.updatedAt
});

export const getMyPreference = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const userId = ensureAuthenticatedUserId(req);

    let preference = await preferenceRepo.getPreferenceByUserId(userId);

    if (!preference) {
      preference = await preferenceRepo.createPreference(buildDefaultPreference(userId));
    }

    return responseHandler.success(
      res,
      toPreferenceResponse(preference),
      "Preference fetched successfully"
    );
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
        ...mapPreferencePayloadToPrisma(payload)
      },
      mapPreferencePayloadToPrisma(payload)
    );

    return responseHandler.success(
      res,
      toPreferenceResponse(preference),
      "Preference updated successfully"
    );
  }
);
