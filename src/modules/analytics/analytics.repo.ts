import { prisma } from "@/src/lib/prisma";
import { AnalyticsEvent, Prisma } from "@/generated/prisma/client";

class AnalyticsRepo {
  async createEvent(data: Prisma.AnalyticsEventUncheckedCreateInput): Promise<AnalyticsEvent> {
    return prisma.analyticsEvent.create({
      data
    });
  }

  async countUserEvents(userId: string): Promise<number> {
    return prisma.analyticsEvent.count({
      where: {
        userId
      }
    });
  }

  async getRecentUserEvents(userId: string): Promise<AnalyticsEvent[]> {
    return prisma.analyticsEvent.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });
  }
}

export { AnalyticsRepo };
export default new AnalyticsRepo();
