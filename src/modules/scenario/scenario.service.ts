import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@/generated/prisma/client";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import scenarioRepo from "./scenario.repo";
import { createScenarioSchema } from "./scenario.schema";

export const getScenariosHandler = asyncHandler(
  async (_req: FastifyRequest, res: FastifyReply) => {
    const scenarios = await scenarioRepo.getScenarios();

    return responseHandler.success(res, scenarios, "Scenarios fetched successfully");
  }
);

export const getScenarioDetailHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const scenario = await scenarioRepo.getScenarioById(id);

    if (!scenario) {
      return responseHandler.notFound(res, "Scenario not found");
    }

    return responseHandler.success(res, scenario, "Scenario fetched successfully");
  }
);

export const createScenarioHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const payload = createScenarioSchema.parse(req.body);

    const scenario = await scenarioRepo.createScenario({
      ...payload,
      config: payload.config as Prisma.InputJsonValue
    });

    return responseHandler.created(res, scenario, "Scenario created successfully");
  }
);
