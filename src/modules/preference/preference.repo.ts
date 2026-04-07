import { prisma } from "@/src/lib/prisma";
import { Preference, Prisma } from "@/generated/prisma/client";

class PreferenceRepo {
  async getPreferenceByUserId(userId: string): Promise<Preference | null> {
    return prisma.preference.findUnique({
      where: {
        userId
      }
    });
  }

  async createPreference(
    data: Prisma.PreferenceUncheckedCreateInput
  ): Promise<Preference> {
    return prisma.preference.create({
      data
    });
  }

  async upsertPreference(
    userId: string,
    data: Prisma.PreferenceUncheckedCreateInput,
    update: Prisma.PreferenceUpdateInput
  ): Promise<Preference> {
    return prisma.preference.upsert({
      where: {
        userId
      },
      create: data,
      update
    });
  }

  async updatePreference(
    userId: string,
    data: Prisma.PreferenceUpdateInput
  ): Promise<Preference> {
    return prisma.preference.update({
      where: {
        userId
      },
      data
    });
  }

  async deletePreference(userId: string): Promise<void> {
    await prisma.preference.delete({
      where: {
        userId
      }
    });
  }
}

export { PreferenceRepo };
export default new PreferenceRepo();
