import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@/generated/prisma/client";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import analyticsRepo from "./analytics.repo";
import { createAnalyticsEventSchema } from "./analytics.schema";

const canAccessAnalytics = (req: FastifyRequest, targetUserId: string) => {
  if (!req.authUser) {
    throw new Error("Unauthorized");
  }

  return req.authUser.id === targetUserId || req.authUser.role === "ADMIN";
};

const toAnalyticsEventResponse = (
  event: Awaited<ReturnType<typeof analyticsRepo.getRecentUserEvents>>[number]
) => ({
  id: event.id,
  user_id: event.userId,
  event: event.event,
  metadata: event.metadata,
  created_at: event.createdAt
});

export const createAnalyticsEventHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = createAnalyticsEventSchema.parse(req.body);
    const event = await analyticsRepo.createEvent({
      userId: req.authUser.id,
      event: payload.event,
      metadata: (payload.metadata ?? null) as Prisma.InputJsonValue
    });

    return responseHandler.created(
      res,
      toAnalyticsEventResponse(event),
      "Analytics event created successfully"
    );
  }
);

export const getUserAnalyticsHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = id;

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
        recentEvents: recentEvents.map((event) => toAnalyticsEventResponse(event))
      },
      "Analytics fetched successfully"
    );
  }
);
