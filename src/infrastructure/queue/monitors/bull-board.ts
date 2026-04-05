import type { FastifyInstance } from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { getEmailQueue } from "../queues/email.queue";
import { getDlqQueue } from "../queues/dlq.queue";

export const registerBullBoard = async (app: FastifyInstance) => {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(getEmailQueue()), new BullMQAdapter(getDlqQueue())],
    serverAdapter
  });

  await app.register(serverAdapter.registerPlugin(), {
    prefix: "/admin/queues"
  });
};
