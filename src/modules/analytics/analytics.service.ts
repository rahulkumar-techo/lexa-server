import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@/generated/prisma/client";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import analyticsRepo from "./analytics.repo";
import { createAnalyticsEventSchema } from "./analytics.schema";

const canAccessAnalytics = (req: FastifyRequest, targetUserId: number) => {
  if (!req.authUser) {
    throw new Error("Unauthorized");
  }

  return req.authUser.id === targetUserId || req.authUser.role === "admin";
};

export const createAnalyticsEventHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = createAnalyticsEventSchema.parse(req.body);
    const event = await analyticsRepo.createEvent({
      user_id: req.authUser.id,
      event: payload.event,
      metadata: (payload.metadata ?? null) as Prisma.InputJsonValue
    });

    return responseHandler.created(res, event, "Analytics event created successfully");
  }
);

export const getUserAnalyticsHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = Number(id);

    if (!canAccessAnalytics(req, userId)) {
      return responseHandler.forbidden(res, "Forbidden");
    }

    const [totalEvents, recentEvents] = await Promise.all([
      analyticsRepo.countUserEvents(userId),
      analyticsRepo.getRecentUserEvents(userId)
    ]);

    return responseHandler.success(
      res,
      {
        totalEvents,
        recentEvents
      },
      "Analytics fetched successfully"
    );
  }
);
