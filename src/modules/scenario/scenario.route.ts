import type { FastifyInstance } from "fastify";
import { authenticate, authorize } from "@/src/modules/auth/auth.guard";
import {
  createScenarioRouteSchema,
  getScenarioDetailRouteSchema,
  getScenariosRouteSchema
} from "@/src/docs/scenario";

import {
  createScenarioHandler,
  getScenarioDetailHandler,
  getScenariosHandler
} from "./scenario.service";

const scenarioRoute = async (app: FastifyInstance) => {
  app.get(
    "/",
    {
      schema: getScenariosRouteSchema
    },
    getScenariosHandler
  );

  app.get(
    "/:id",
    {
      schema: getScenarioDetailRouteSchema
    },
    getScenarioDetailHandler
  );

  app.post(
    "/",
    {
      schema: createScenarioRouteSchema,
      preHandler: [authenticate, authorize(["admin"])]
    },
    createScenarioHandler
  );
};

export default scenarioRoute;
