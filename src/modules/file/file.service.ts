import { FastifyReply, FastifyRequest } from "fastify";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import fileRepo from "./file.repo";
import { uploadFileSchema } from "./file.schema";

const toFileResponse = (file: Awaited<ReturnType<typeof fileRepo.createFile>>) => ({
  id: file.id,
  user_id: file.userId,
  url: file.url,
  type: file.type,
  size: file.size,
  created_at: file.createdAt
});

export const uploadFileHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = uploadFileSchema.parse(req.body);
    const file = await fileRepo.createFile({
      userId: req.authUser.id,
      url: payload.url,
      type: payload.type,
      size: payload.size
    });

    return responseHandler.created(res, toFileResponse(file), "File uploaded successfully");
  }
);
