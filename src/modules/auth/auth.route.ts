import type { FastifyInstance } from "fastify";
import {
  forgotPasswordRouteSchema,
  loginRouteSchema,
  logoutRouteSchema,
  refreshRouteSchema,
  registerRouteSchema,
  resetPasswordRouteSchema,
  verifyOtpRouteSchema,
  verifyRouteSchema
} from "@/src/docs/auth";
import {
  adminOnlyHandler,
  forgotPasswordHandler,
  getCurrentUserHandler,
  loginByEmail,
  logoutHandler,
  refreshHandler,
  registerByEmail,
  resetPasswordHandler,
  verifyUserByOtp,
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
    "/verify-otp",
    {
      schema: verifyOtpRouteSchema
    },
    verifyUserByOtp
  );

  app.post(
    "/login",
    {
      schema: loginRouteSchema
    },
    loginByEmail
  );

  app.post(
    "/forgot-password",
    {
      schema: forgotPasswordRouteSchema
    },
    forgotPasswordHandler
  );

  app.post(
    "/reset-password",
    {
      schema: resetPasswordRouteSchema
    },
    resetPasswordHandler
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
