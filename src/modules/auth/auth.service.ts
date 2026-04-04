import authRepo from "./auth.repo";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  generateAuthTokens,
  setAuthCookies,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS
} from "./auth.token";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema, registerSchema, verificationParamsSchema } from "./auth.schema";
import bcrypt from "bcrypt";
import { generateVerificationToken, verifyVerificationToken } from "@/src/utils/verification";
import { env } from "@/src/config/env";
import { User, UserStatus } from "@/generated/prisma/client";
import { randomUUID } from "crypto";

const toPublicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  isVerified: user.is_verified,
  created_at: user.created_at,
  email_verified_at: user.email_verified_at
});

const issueAuthSession = async (
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

const ensureLoginAllowed = async (user: User) => {
  if (user.status === UserStatus.BANNED) {
    throw new Error("Your account has been banned");
  }

  if (!user.is_verified) {
    throw new Error("Verify your email before logging in");
  }

  if (user.status !== UserStatus.ACTIVE) {
    return authRepo.updateUser(user.id, {
      status: UserStatus.ACTIVE
    });
  }

  return user;
};

export const registerByEmail = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const existingUser = await authRepo.getUser({ email });

  if (existingUser) {
    return responseHandler.badRequest(res, "User already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await authRepo.createUser({
    name,
    email,
    passwordHash
  });
  const { token } = generateVerificationToken(req.server, email);
  const verificationLink = `http://localhost:${env.PORT}/api/v1/auth/verify?token=${encodeURIComponent(token)}`;

  return responseHandler.created(
    res,
    {
      user: toPublicUser(newUser),
      verificationToken: token,
      verificationLink
    },
    "User registered successfully. Verify the account to continue."
  );
});

export const verifyUserByToken = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const { token } = verificationParamsSchema.parse(req.query);
  let decoded: { email: string; purpose: "email-verification" };

  try {
    decoded = verifyVerificationToken(req.server, token);
  } catch {
    return responseHandler.badRequest(res, "Invalid or expired token");
  }

  if (decoded.purpose !== "email-verification") {
    return responseHandler.badRequest(res, "Invalid verification token");
  }

  const user = await authRepo.getUser({ email: decoded.email });

  if (!user) {
    return responseHandler.notFound(res, "User not found");
  }

  if (user.is_verified) {
    return responseHandler.badRequest(res, "User already verified");
  }

  const verifiedUser = await authRepo.markUserAsVerified(user.id);
  const data = await issueAuthSession(req, res, verifiedUser);

  return responseHandler.success(res, data, "Account verified successfully");
});

export const loginByEmail = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await authRepo.getUser({ email });

  if (!user || !user.password_hash) {
    return responseHandler.unauthorized(res, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return responseHandler.unauthorized(res, "Invalid email or password");
  }

  let activeUser: User;

  try {
    activeUser = await ensureLoginAllowed(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";

    if (message === "Your account has been banned") {
      return responseHandler.forbidden(res, message);
    }

    return responseHandler.forbidden(res, message);
  }

  const data = await issueAuthSession(req, res, activeUser);

  return responseHandler.success(res, data, "Login successful");
});

export const refreshHandler = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    return responseHandler.unauthorized(res, "Refresh token is missing");
  }

  let payload: { sub: number; sessionId: string; type: "refresh" };

  try {
    payload = verifyRefreshToken(req.server, refreshToken);
  } catch {
    clearAuthCookies(res);
    return responseHandler.forbidden(res, "Invalid or expired refresh token");
  }

  if (payload.type !== "refresh") {
    clearAuthCookies(res);
    return responseHandler.forbidden(res, "Invalid refresh token");
  }

  const user = await authRepo.getUser({ id: Number(payload.sub) });
  const session = await authRepo.getSessionById(payload.sessionId);

  if (!user || !session) {
    clearAuthCookies(res);
    return responseHandler.notFound(res, "Session not found");
  }

  if (session.refresh_token !== refreshToken || session.expires_at <= new Date()) {
    clearAuthCookies(res);
    await authRepo.deleteSessionById(session.id);
    return responseHandler.forbidden(res, "Invalid or expired refresh token");
  }

  let activeUser: User;

  try {
    activeUser = await ensureLoginAllowed(user);
  } catch (error) {
    clearAuthCookies(res);
    const message = error instanceof Error ? error.message : "Unauthorized";
    return responseHandler.forbidden(res, message);
  }

  const data = await issueAuthSession(req, res, activeUser, session.id);

  return responseHandler.success(res, data, "Session refreshed successfully");
});

export const logoutHandler = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (refreshToken) {
    const session = await authRepo.getSessionByRefreshToken(refreshToken);

    if (session) {
      await authRepo.deleteSessionById(session.id);
    }
  }

  clearAuthCookies(res);

  return responseHandler.success(
    res,
    {
      clearedCookies: [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]
    },
    "Logout successful"
  );
});

export const getCurrentUserHandler = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  if (!req.authUser) {
    return responseHandler.unauthorized(res, "Unauthorized");
  }

  return responseHandler.success(res, toPublicUser(req.authUser), "Authenticated user fetched");
});

export const adminOnlyHandler = asyncHandler(async (req: FastifyRequest, res: FastifyReply) => {
  if (!req.authUser) {
    return responseHandler.unauthorized(res, "Unauthorized");
  }

  return responseHandler.success(
    res,
    {
      user: toPublicUser(req.authUser),
      access: "admin"
    },
    "Admin access granted"
  );
});
