import { prisma } from "@/src/lib/prisma";
import { Prisma, Scenario } from "@/generated/prisma/client";

class ScenarioRepo {
  async getScenarios(): Promise<Scenario[]> {
    return prisma.scenario.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async getScenarioById(id: string): Promise<Scenario | null> {
    return prisma.scenario.findUnique({
      where: { id }
    });
  }

  async createScenario(data: Prisma.ScenarioCreateInput): Promise<Scenario> {
    return prisma.scenario.create({
      data
    });
  }
}

export { ScenarioRepo };
export default new ScenarioRepo();
