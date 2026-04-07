import authRepo from "./auth.repo";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_MS,
  generateAuthTokens,
  setAuthCookies,
  verifyAccessToken,
  verifyRefreshToken
} from "./auth.token";
import { User, UserStatus } from "@/generated/prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { isAdminRole } from "./auth.helpers";

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const getAuthorizedUser = async (userId: string): Promise<User | null> => {
  const user = await authRepo.getUser({ id: userId });

  if (!user) {
    return null;
  }

  if (!user.isVerified || user.status === UserStatus.BANNED) {
    return null;
  }

  if (user.status !== UserStatus.ACTIVE) {
    return authRepo.updateUser(user.id, {
      status: UserStatus.ACTIVE
    });
  }

  return user;
};

const rotateSessionTokens = async (
  req: FastifyRequest,
  reply: FastifyReply,
  user: User,
  sessionId: string
) => {
  const tokens = generateAuthTokens(req.server, user, sessionId);

  await authRepo.rotateSession({
    sessionId,
    refreshToken: tokens.refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  });

  setAuthCookies(reply, tokens);
  req.authUser = user;
};

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const accessToken =
    getBearerToken(req.headers.authorization) ?? req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (accessToken) {
    try {
      const payload = verifyAccessToken(req.server, accessToken);
      const user = await getAuthorizedUser(payload.sub);

      if (!user) {
        return reply.status(401).send({
          success: false,
          message: "Unauthorized"
        });
      }

      req.authUser = user;
      return;
    } catch {
      // Fall through to refresh-token validation.
    }
  }

  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    return reply.status(401).send({
      success: false,
      message: "Unauthorized"
    });
  }

  try {
    const payload = verifyRefreshToken(req.server, refreshToken);

    if (payload.type !== "refresh") {
      return reply.status(401).send({
        success: false,
        message: "Unauthorized"
      });
    }

    const [user, session] = await Promise.all([
      getAuthorizedUser(payload.sub),
      authRepo.getSessionById(payload.sessionId)
    ]);

    if (!user || !session) {
      return reply.status(401).send({
        success: false,
        message: "Unauthorized"
      });
    }

    if (session.refreshToken !== refreshToken || session.expiresAt <= new Date()) {
      await authRepo.deleteSessionById(session.id);

      return reply.status(401).send({
        success: false,
        message: "Unauthorized"
      });
    }

    await rotateSessionTokens(req, reply, user, session.id);
  } catch {
    return reply.status(401).send({
      success: false,
      message: "Unauthorized"
    });
  }
};

export const authorize = (roles: string[]) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.authUser) {
      return reply.status(401).send({
        success: false,
        message: "Unauthorized"
      });
    }

    const normalizedRoles = roles.map((role) => role.toLowerCase());
    const currentRole = req.authUser.role.toLowerCase();

    if (!normalizedRoles.includes(currentRole) && !(isAdminRole(req.authUser.role) && normalizedRoles.includes("admin"))) {
      return reply.status(403).send({
        success: false,
        message: "Forbidden"
      });
    }
  };
};
