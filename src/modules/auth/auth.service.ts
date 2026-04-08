import bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";
import { User, UserStatus } from "@/generated/prisma/client";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import {
  generatePasswordResetToken,
  generateVerificationToken,
  verifyVerificationToken
} from "@/src/utils/verification";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationParamsSchema,
  verifyOtpSchema
} from "./auth.schema";
import authRepo from "./auth.repo";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_MS,
  clearAuthCookies,
  generateAuthTokens,
  setAuthCookies,
  verifyRefreshToken
} from "./auth.token";
import {
  getRequestOrigin,
  getSingleHeaderValue,
  isAdminRole,
  toPublicUser
} from "./auth.helpers";
import { enqueueAuthEmailJob } from "@/src/infrastructure/queue/jobs/email.job";
import { queueConfig } from "@/src/infrastructure/queue/queue.config";
import { mailService } from "../mails/mail.service";
import { env } from "@/src/config/env";

const logAuthWarning = (message: string, context: Record<string, unknown>) => {
  console.warn(
    JSON.stringify({
      scope: "auth",
      level: "warn",
      message,
      ...context,
      timestamp: new Date().toISOString()
    })
  );
};

const isTestRuntime =
  env.NODE_ENV === "test" ||
  process.argv.includes("--test") ||
  process.argv.some((arg) => arg.includes(".test.")) ||
  process.env.npm_lifecycle_event === "test";

class AuthService {
  private sendVerificationEmail = async (
    user: Pick<User, "id" | "email" | "role"> & { name: string | null },
    verificationUrl: string,
    otp: string
  ) =>
    mailService.sendVerification({
      to: { email: user.email, name: user.name ?? user.email },
      user: {
        firstName: user.name ?? user.email,
        email: user.email
      },
      verificationUrl,
      otp
    });

  private sendForgotPasswordEmail = async (
    user: Pick<User, "id" | "email" | "role"> & { name: string | null },
    resetUrl: string,
    req: FastifyRequest
  ) =>
    mailService.sendForgotPassword({
      to: { email: user.email, name: user.name ?? user.email },
      user: {
        firstName: user.name ?? user.email,
        email: user.email
      },
      resetUrl,
      requestedAt: new Date(),
      ipAddress: req.ip,
      userAgent: getSingleHeaderValue(req.headers["user-agent"])
    });

  private sendResetPasswordConfirmationEmail = async (
    user: Pick<User, "id" | "email" | "role"> & { name: string | null },
    req: FastifyRequest
  ) =>
    mailService.sendResetPasswordConfirm({
      to: { email: user.email, name: user.name ?? user.email },
      user: {
        firstName: user.name ?? user.email,
        email: user.email
      },
      changedAt: new Date(),
      ipAddress: req.ip,
      deviceInfo: getSingleHeaderValue(req.headers["user-agent"])
    });

  private issueAuthSession = async (
    req: FastifyRequest,
    reply: FastifyReply,
    user: User,
    sessionId?: string
  ) => {
    const activeSessionId =
      sessionId ??
      (
        await authRepo.createSession({
          userId: user.id,
          refreshToken: randomUUID(),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
        })
      ).id;

    const tokens = generateAuthTokens(req.server, user, activeSessionId);

    await authRepo.rotateSession({
      sessionId: activeSessionId,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    });

    setAuthCookies(reply, tokens);

    return {
      user: toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: "Bearer"
    };
  };

  private ensureLoginAllowed = async (user: User) => {
    if (user.status === UserStatus.BANNED) {
      throw new Error("Your account has been banned");
    }

    if (!user.isVerified) {
      throw new Error("Verify your email before logging in");
    }

    if (user.status !== UserStatus.ACTIVE) {
      return authRepo.updateUser(user.id, {
        status: UserStatus.ACTIVE
      });
    }

    return user;
  };

  private enqueueWelcomeEmail = async (user: User, requestId?: string) => {
    if (!queueConfig.isQueueExecutionEnabled) {
      return;
    }

    try {
      await enqueueAuthEmailJob({
        type: "welcome",
        email: user.email,
        name: user.name ?? user.email,
        userId: user.id,
        isVip: isAdminRole(user.role),
        requestId
      });
    } catch (error) {
      logAuthWarning("welcome email enqueue failed", {
        email: user.email,
        requestId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  private completeUserVerification = async (
    req: FastifyRequest,
    reply: FastifyReply,
    email: string
  ) => {
    const user = await authRepo.getUser({ email });

    if (!user) {
      return responseHandler.notFound(reply, "User not found");
    }

    if (user.isVerified) {
      return responseHandler.badRequest(reply, "User already verified");
    }

    const verifiedUser = await authRepo.markUserAsVerified(user.id);
    const data = await this.issueAuthSession(req, reply, verifiedUser);

    await this.enqueueWelcomeEmail(verifiedUser, req.id);

    return responseHandler.success(reply, data, "Account verified successfully");
  };

  registerByEmail = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const existingUser = await authRepo.getUser({ email });

    if (existingUser) {
      return responseHandler.badRequest(reply, "User already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await authRepo.createUser({
      name,
      email,
      passwordHash
    });

    const { token, otp } = generateVerificationToken(req.server, email);
    const verificationLink = `${getRequestOrigin(req)}/api/v1/auth/verify?token=${encodeURIComponent(token)}`;

    await this.sendVerificationEmail(newUser, verificationLink, otp);

    return responseHandler.created(
      reply,
      {
        user: toPublicUser(newUser),
        ...(isTestRuntime
          ? {
              verificationToken: token,
              verificationLink
            }
          : {}),
        mailProvider: mailService.getProviderName()
      },
      "User registered successfully. Verification email sent."
    );
  });

  verifyUserByToken = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = verificationParamsSchema.parse(req.query);
    let decoded: { email: string; purpose: "email-verification" };

    try {
      decoded = verifyVerificationToken(req.server, token) as { email: string; purpose: "email-verification" };
    } catch {
      return responseHandler.badRequest(reply, "Invalid or expired token");
    }

    if (decoded.purpose !== "email-verification") {
      return responseHandler.badRequest(reply, "Invalid verification token");
    }

    return this.completeUserVerification(req, reply, decoded.email);
  });

  verifyUserByOtp = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const { token, otp } = verifyOtpSchema.parse(req.body);
    let decoded: { email: string; purpose: "email-verification"; otp?: string };

    try {
      decoded = verifyVerificationToken(req.server, token) as {
        email: string;
        purpose: "email-verification";
        otp?: string;
      };
    } catch {
      return responseHandler.badRequest(reply, "Invalid or expired token");
    }

    if (decoded.purpose !== "email-verification" || !decoded.otp || decoded.otp !== otp) {
      return responseHandler.badRequest(reply, "Invalid verification OTP");
    }

    return this.completeUserVerification(req, reply, decoded.email);
  });

  loginByEmail = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await authRepo.getUser({ email });

    if (!user || !user.passwordHash) {
      return responseHandler.unauthorized(reply, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return responseHandler.unauthorized(reply, "Invalid email or password");
    }

    let activeUser: User;

    try {
      activeUser = await this.ensureLoginAllowed(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return responseHandler.forbidden(reply, message);
    }

    const data = await this.issueAuthSession(req, reply, activeUser);

    return responseHandler.success(reply, data, "Login successful");
  });

  forgotPasswordHandler = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await authRepo.getUser({ email });

    if (user?.passwordHash) {
      const { token } = generatePasswordResetToken(
        req.server,
        user.email,
        user.updatedAt.toISOString()
      );
      const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

      await this.sendForgotPasswordEmail(user, resetUrl, req);
    }

    return responseHandler.success(
      reply,
      undefined,
      "If the account exists, a password reset email has been sent."
    );
  });

  resetPasswordHandler = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    let decoded: { email: string; purpose: "password-reset"; userUpdatedAt?: string };

    try {
      decoded = verifyVerificationToken(req.server, token) as {
        email: string;
        purpose: "password-reset";
        userUpdatedAt?: string;
      };
    } catch {
      return responseHandler.badRequest(reply, "Invalid or expired token");
    }

    if (decoded.purpose !== "password-reset" || !decoded.userUpdatedAt) {
      return responseHandler.badRequest(reply, "Invalid reset token");
    }

    const user = await authRepo.getUser({ email: decoded.email });

    if (!user || !user.passwordHash) {
      return responseHandler.notFound(reply, "User not found");
    }

    if (user.updatedAt.toISOString() !== decoded.userUpdatedAt) {
      return responseHandler.badRequest(reply, "Reset token is no longer valid");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await authRepo.updateUser(user.id, {
      passwordHash
    });
    await authRepo.deleteSessionsByUserId(user.id);

    await this.sendResetPasswordConfirmationEmail(user, req);

    clearAuthCookies(reply);

    return responseHandler.success(reply, undefined, "Password reset successful");
  });

  refreshHandler = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      return responseHandler.unauthorized(reply, "Refresh token is missing");
    }

    let payload: { sub: string; sessionId: string; type: "refresh" };

    try {
      payload = verifyRefreshToken(req.server, refreshToken);
    } catch {
      clearAuthCookies(reply);
      return responseHandler.forbidden(reply, "Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      clearAuthCookies(reply);
      return responseHandler.forbidden(reply, "Invalid refresh token");
    }

    const user = await authRepo.getUser({ id: payload.sub });
    const session = await authRepo.getSessionById(payload.sessionId);

    if (!user || !session) {
      clearAuthCookies(reply);
      return responseHandler.notFound(reply, "Session not found");
    }

    if (session.refreshToken !== refreshToken || session.expiresAt <= new Date()) {
      clearAuthCookies(reply);
      await authRepo.deleteSessionById(session.id);
      return responseHandler.forbidden(reply, "Invalid or expired refresh token");
    }

    let activeUser: User;

    try {
      activeUser = await this.ensureLoginAllowed(user);
    } catch (error) {
      clearAuthCookies(reply);
      const message = error instanceof Error ? error.message : "Unauthorized";
      return responseHandler.forbidden(reply, message);
    }

    const data = await this.issueAuthSession(req, reply, activeUser, session.id);

    return responseHandler.success(reply, data, "Session refreshed successfully");
  });

  logoutHandler = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      const session = await authRepo.getSessionByRefreshToken(refreshToken);

      if (session) {
        await authRepo.deleteSessionById(session.id);
      }
    }

    clearAuthCookies(reply);

    return responseHandler.success(
      reply,
      {
        clearedCookies: [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]
      },
      "Logout successful"
    );
  });

  getCurrentUserHandler = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(reply, "Unauthorized");
    }

    return responseHandler.success(reply, toPublicUser(req.authUser), "Authenticated user fetched");
  });

  adminOnlyHandler = asyncHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(reply, "Unauthorized");
    }

    return responseHandler.success(
      reply,
      {
        user: toPublicUser(req.authUser),
        access: "admin"
      },
      "Admin access granted"
    );
  });
}

export const authService = new AuthService();
