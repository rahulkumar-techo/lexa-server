import { env } from "@/src/config/env";
import { User } from "@/generated/prisma/client";
import { FastifyInstance, FastifyReply } from "fastify";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AccessTokenPayload = {
  sub: number;
  email: string;
  role: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: number;
  sessionId: string;
  type: "refresh";
};

export const getPublicCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge
});

export const generateAccessToken = (app: FastifyInstance, user: User) => {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: "access"
  };

  return app.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
};

export const generateRefreshToken = (app: FastifyInstance, user: User, sessionId: string) => {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    sessionId,
    type: "refresh"
  };

  return app.jwt.sign(payload, { expiresIn: REFRESH_TOKEN_TTL });
};

export const generateAuthTokens = (app: FastifyInstance, user: User, sessionId: string) => {
  return {
    accessToken: generateAccessToken(app, user),
    refreshToken: generateRefreshToken(app, user, sessionId)
  };
};

export const setAuthCookies = (
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string }
) => {
  reply
    .setCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, getPublicCookieOptions(ACCESS_TOKEN_MAX_AGE))
    .setCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, getPublicCookieOptions(REFRESH_TOKEN_MAX_AGE));
};

export const clearAuthCookies = (reply: FastifyReply) => {
  reply
    .clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" })
    .clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
};

export const verifyRefreshToken = (app: FastifyInstance, token: string) => {
  return app.jwt.verify<RefreshTokenPayload>(token);
};

export const verifyAccessToken = (app: FastifyInstance, token: string) => {
  return app.jwt.verify<AccessTokenPayload>(token);
};
