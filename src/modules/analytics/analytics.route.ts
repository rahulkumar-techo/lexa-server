import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import {
  createAnalyticsEventRouteSchema,
  getUserAnalyticsRouteSchema
} from "@/src/docs/analytics";
import {
  createAnalyticsEventHandler,
  getUserAnalyticsHandler
} from "./analytics.service";

const analyticsRoute = async (app: FastifyInstance) => {
  app.post(
    "/events",
    {
      schema: createAnalyticsEventRouteSchema,
      preHandler: [authenticate]
    },
    createAnalyticsEventHandler
  );

  app.get(
    "/users/:id",
    {
      schema: getUserAnalyticsRouteSchema,
      preHandler: [authenticate]
    },
    getUserAnalyticsHandler
  );
};

export default analyticsRoute;
