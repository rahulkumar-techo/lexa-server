import { prisma } from "@/src/lib/prisma";
import { Prisma, Subscription } from "@/generated/prisma/client";

class PaymentRepo {
  async createSubscription(
    data: Prisma.SubscriptionUncheckedCreateInput
  ): Promise<Subscription> {
    return prisma.subscription.create({
      data
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }
}

export { PaymentRepo };
export default new PaymentRepo();
