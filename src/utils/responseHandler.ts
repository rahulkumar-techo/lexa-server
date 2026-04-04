// Standard API response handler (clean + consistent)

import { FastifyReply } from "fastify";

export const responseHandler = {
  success: (res: FastifyReply, data: any, message = "Success") => {
    return res.status(200).send({
      success: true,
      message,
      data
    });
  },

  created: (res: FastifyReply, data: any, message = "Created") => {
    return res.status(201).send({
      success: true,
      message,
      data
    });
  },

  badRequest: (res: FastifyReply, message = "Bad Request") => {
    return res.status(400).send({
      success: false,
      message
    });
  },

  unauthorized: (res: FastifyReply, message = "Unauthorized") => {
    return res.status(401).send({
      success: false,
      message
    });
  },

  forbidden: (res: FastifyReply, message = "Forbidden") => {
    return res.status(403).send({
      success: false,
      message
    });
  },

  notFound: (res: FastifyReply, message = "Not Found") => {
    return res.status(404).send({
      success: false,
      message
    });
  },

  error: (res: FastifyReply, message = "Internal Server Error") => {
    return res.status(500).send({
      success: false,
      message
    });
  }
};