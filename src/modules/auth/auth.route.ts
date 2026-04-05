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
import { authenticate, authorize } from "./auth.guard";
import { authService } from "./auth.service";

const authRoute = async (app: FastifyInstance) => {
  app.post(
    "/register",
    {
      schema: registerRouteSchema
    },
    authService.registerByEmail
  );

  app.get(
    "/verify",
    {
      schema: verifyRouteSchema
    },
    authService.verifyUserByToken
  );

  app.post(
    "/verify-otp",
    {
      schema: verifyOtpRouteSchema
    },
    authService.verifyUserByOtp
  );

  app.post(
    "/login",
    {
      schema: loginRouteSchema
    },
    authService.loginByEmail
  );

  app.post(
    "/forgot-password",
    {
      schema: forgotPasswordRouteSchema
    },
    authService.forgotPasswordHandler
  );

  app.post(
    "/reset-password",
    {
      schema: resetPasswordRouteSchema
    },
    authService.resetPasswordHandler
  );

  app.post(
    "/refresh",
    {
      schema: refreshRouteSchema
    },
    authService.refreshHandler
  );

  app.post(
    "/logout",
    {
      schema: logoutRouteSchema,
      preHandler: [authenticate]
    },
    authService.logoutHandler
  );

  app.get(
    "/me",
    {
      preHandler: [authenticate]
    },
    authService.getCurrentUserHandler
  );

  app.get(
    "/admin",
    {
      preHandler: [authenticate, authorize(["admin"])]
    },
    authService.adminOnlyHandler
  );
};

export default authRoute;
