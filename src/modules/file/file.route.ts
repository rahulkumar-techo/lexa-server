import type { FastifyInstance } from "fastify";
import { authenticate } from "@/src/modules/auth/auth.guard";
import { uploadFileRouteSchema } from "@/src/docs/file";
import { uploadFileHandler } from "./file.service";

const fileRoute = async (app: FastifyInstance) => {
  app.post(
    "/upload",
    {
      schema: uploadFileRouteSchema,
      preHandler: [authenticate]
    },
    uploadFileHandler
  );
};

export default fileRoute;
