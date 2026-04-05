import { FastifyReply, FastifyRequest } from "fastify";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import paymentRepo from "./payment.repo";
import { createSubscriptionSchema, paymentWebhookSchema } from "./payment.schema";

export const createSubscriptionHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = createSubscriptionSchema.parse(req.body);
    const subscription = await paymentRepo.createSubscription({
      user_id: req.authUser.id,
      provider: payload.provider,
      status: payload.status
    });

    return responseHandler.created(res, subscription, "Subscription created successfully");
  }
);

export const paymentWebhookHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const payload = paymentWebhookSchema.parse(req.body);
    const user = await paymentRepo.getUserById(payload.userId);

    if (!user) {
      return responseHandler.notFound(res, "User not found");
    }

    const subscription = await paymentRepo.createSubscription({
      user_id: payload.userId,
      provider: payload.provider,
      status: payload.status
    });

    return responseHandler.success(res, subscription, "Webhook processed successfully");
  }
);
