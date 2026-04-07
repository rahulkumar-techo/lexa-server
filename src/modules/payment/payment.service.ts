import { FastifyReply, FastifyRequest } from "fastify";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import paymentRepo from "./payment.repo";
import { createSubscriptionSchema, paymentWebhookSchema } from "./payment.schema";

const toSubscriptionResponse = (
  subscription: Awaited<ReturnType<typeof paymentRepo.createSubscription>>
) => ({
  id: subscription.id,
  user_id: subscription.userId,
  provider: subscription.provider,
  status: subscription.status,
  created_at: subscription.createdAt
});

export const createSubscriptionHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = createSubscriptionSchema.parse(req.body);
    const subscription = await paymentRepo.createSubscription({
      userId: req.authUser.id,
      provider: payload.provider,
      status: payload.status
    });

    return responseHandler.created(
      res,
      toSubscriptionResponse(subscription),
      "Subscription created successfully"
    );
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
      userId: payload.userId,
      provider: payload.provider,
      status: payload.status
    });

    return responseHandler.success(
      res,
      toSubscriptionResponse(subscription),
      "Webhook processed successfully"
    );
  }
);
