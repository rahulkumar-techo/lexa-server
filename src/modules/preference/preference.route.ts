import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import {
  getPreferenceRouteSchema,
  updatePreferenceRouteSchema
} from "@/src/docs/preference";
import {
  getMyPreference,
  upsertMyPreference
} from "./preference.service";

const preferenceRoute = async (app: FastifyInstance) => {
  app.get(
    "/me",
    {
      schema: getPreferenceRouteSchema,
      preHandler: [authenticate]
    },
    getMyPreference
  );

  app.put(
    "/me",
    {
      schema: updatePreferenceRouteSchema,
      preHandler: [authenticate]
    },
    upsertMyPreference
  );
};

export default preferenceRoute;
