import type { FastifyInstance } from "fastify";
import {
  loginRouteSchema,
  logoutRouteSchema,
  refreshRouteSchema,
  registerRouteSchema,
  verifyRouteSchema
} from "@/src/docs/auth";
import {
  adminOnlyHandler,
  getCurrentUserHandler,
  loginByEmail,
  logoutHandler,
  refreshHandler,
  registerByEmail,
  verifyUserByToken
} from "./auth.service";
import { authenticate, authorize } from "./auth.guard";

const authRoute = async (app: FastifyInstance) => {
  app.post(
    "/register",
    {
      schema: registerRouteSchema
    },
    registerByEmail
  );

  app.get(
    "/verify",
    {
      schema: verifyRouteSchema
    },
    verifyUserByToken
  );

  app.post(
    "/login",
    {
      schema: loginRouteSchema
    },
    loginByEmail
  );

  app.post(
    "/refresh",
    {
      schema: refreshRouteSchema
    },
    refreshHandler
  );

  app.post(
    "/logout",
    {
      schema: logoutRouteSchema,
      preHandler: [authenticate]
    },
    logoutHandler
  );

  app.get(
    "/me",
    {
      preHandler: [authenticate]
    },
    getCurrentUserHandler
  );

  app.get(
    "/admin",
    {
      preHandler: [authenticate, authorize(["admin"])]
    },
    adminOnlyHandler
  );
};

export default authRoute;
