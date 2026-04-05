import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import { getUserRouteSchema, updateUserRouteSchema } from "@/src/docs/user";
import { getUserProfileHandler, updateUserProfileHandler } from "./user.service";

const userRoute = async (app: FastifyInstance) => {
  app.get(
    "/:id",
    {
      schema: getUserRouteSchema,
      preHandler: [authenticate]
    },
    getUserProfileHandler
  );

  app.patch(
    "/:id",
    {
      schema: updateUserRouteSchema,
      preHandler: [authenticate]
    },
    updateUserProfileHandler
  );
};

export default userRoute;
