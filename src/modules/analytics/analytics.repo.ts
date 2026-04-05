import { prisma } from "@/src/lib/prisma";
import { AnalyticsEvent, Prisma } from "@/generated/prisma/client";

class AnalyticsRepo {
  async createEvent(data: Prisma.AnalyticsEventUncheckedCreateInput): Promise<AnalyticsEvent> {
    return prisma.analyticsEvent.create({
      data
    });
  }

  async countUserEvents(userId: number): Promise<number> {
    return prisma.analyticsEvent.count({
      where: {
        user_id: userId
      }
    });
  }

  async getRecentUserEvents(userId: number): Promise<AnalyticsEvent[]> {
    return prisma.analyticsEvent.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        created_at: "desc"
      },
      take: 20
    });
  }
}

export { AnalyticsRepo };
export default new AnalyticsRepo();
