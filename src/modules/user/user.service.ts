import { FastifyReply, FastifyRequest } from "fastify";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import userRepo from "./user.repo";
import { updateUserSchema } from "./user.schema";

const ensureRequesterCanAccessUser = (
  req: FastifyRequest,
  targetUserId: string
) => {
  if (!req.authUser) {
    throw new Error("Unauthorized");
  }

  if (req.authUser.id !== targetUserId && req.authUser.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
};

const toPublicProfile = (user: Awaited<ReturnType<typeof userRepo.getUserById>> extends infer T
  ? Exclude<T, null>
  : never) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar_url: user.avatarUrl,
  bio: user.bio,
  role: user.role.toLowerCase(),
  status: user.status,
  is_verified: user.isVerified,
  email_verified_at: user.emailVerifiedAt,
  created_at: user.createdAt,
  updated_at: user.updatedAt
});

export const getUserProfileHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = id;

    ensureRequesterCanAccessUser(req, userId);

    const user = await userRepo.getUserById(userId);

    if (!user) {
      return responseHandler.notFound(res, "User not found");
    }

    return responseHandler.success(res, toPublicProfile(user), "User fetched successfully");
  }
);

export const updateUserProfileHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const userId = id;

    ensureRequesterCanAccessUser(req, userId);

    const payload = updateUserSchema.parse(req.body);
    const updatedUser = await userRepo.updateUser(userId, {
      name: payload.name,
      avatarUrl: payload.avatar_url,
      bio: payload.bio
    });

    return responseHandler.success(
      res,
      toPublicProfile(updatedUser),
      "User updated successfully"
    );
  }
);
