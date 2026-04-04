// Async handler for Fastify routes

import { FastifyRequest, FastifyReply } from "fastify";

export const asyncHandler =
  (fn: (req: FastifyRequest, res: FastifyReply) => Promise<any>) =>
  async (req: FastifyRequest, res: FastifyReply) => {
    try {
      return await fn(req, res);
    } catch (error: any) {
      req.log.error(error);

      return res.status(500).send({
        message: error.message || "Internal Server Error"
      });
    }
  };