import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import {
  createSubscriptionRouteSchema,
  paymentWebhookRouteSchema
} from "@/src/docs/payment";
import { createSubscriptionHandler, paymentWebhookHandler } from "./payment.service";

const paymentRoute = async (app: FastifyInstance) => {
  app.post(
    "/subscribe",
    {
      schema: createSubscriptionRouteSchema,
      preHandler: [authenticate]
    },
    createSubscriptionHandler
  );

  app.post(
    "/webhook",
    {
      schema: paymentWebhookRouteSchema
    },
    paymentWebhookHandler
  );
};

export default paymentRoute;
