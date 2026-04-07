import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@/generated/prisma/client";
import { asyncHandler } from "@/src/utils/asyncHandler";
import { responseHandler } from "@/src/utils/responseHandler";
import scenarioRepo from "./scenario.repo";
import { createScenarioSchema } from "./scenario.schema";

const toScenarioResponse = (
  scenario: Awaited<ReturnType<typeof scenarioRepo.getScenarioById>> extends infer T
    ? Exclude<T, null>
    : never
) => ({
  id: scenario.id,
  title: scenario.title,
  description: scenario.description,
  config: scenario.config,
  created_at: scenario.createdAt
});

export const getScenariosHandler = asyncHandler(
  async (_req: FastifyRequest, res: FastifyReply) => {
    const scenarios = await scenarioRepo.getScenarios();

    return responseHandler.success(
      res,
      scenarios.map((scenario) => toScenarioResponse(scenario)),
      "Scenarios fetched successfully"
    );
  }
);

export const getScenarioDetailHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const { id } = req.params as { id: string };
    const scenario = await scenarioRepo.getScenarioById(id);

    if (!scenario) {
      return responseHandler.notFound(res, "Scenario not found");
    }

    return responseHandler.success(
      res,
      toScenarioResponse(scenario),
      "Scenario fetched successfully"
    );
  }
);

export const createScenarioHandler = asyncHandler(
  async (req: FastifyRequest, res: FastifyReply) => {
    const payload = createScenarioSchema.parse(req.body);

    const scenario = await scenarioRepo.createScenario({
      ...payload,
      config: payload.config as Prisma.InputJsonValue
    });

    return responseHandler.created(
      res,
      toScenarioResponse(scenario),
      "Scenario created successfully"
    );
  }
);
