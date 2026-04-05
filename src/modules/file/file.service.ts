import { FastifyReply, FastifyRequest } from "fastify";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import fileRepo from "./file.repo";
import { uploadFileSchema } from "./file.schema";

export const uploadFileHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.authUser) {
      return responseHandler.unauthorized(res, "Unauthorized");
    }

    const payload = uploadFileSchema.parse(req.body);
    const file = await fileRepo.createFile({
      user_id: req.authUser.id,
      url: payload.url,
      type: payload.type,
      size: payload.size
    });

    return responseHandler.created(res, file, "File uploaded successfully");
  }
);
