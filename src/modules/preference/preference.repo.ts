import { prisma } from "@/src/lib/prisma";
import { Preference, Prisma } from "@/generated/prisma/client";

class PreferenceRepo {
  async getPreferenceByUserId(userId: number): Promise<Preference | null> {
    return prisma.preference.findUnique({
      where: {
        user_id: userId
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
    userId: number,
    data: Prisma.PreferenceUncheckedCreateInput,
    update: Prisma.PreferenceUpdateInput
  ): Promise<Preference> {
    return prisma.preference.upsert({
      where: {
        user_id: userId
      },
      create: data,
      update
    });
  }

  async updatePreference(
    userId: number,
    data: Prisma.PreferenceUpdateInput
  ): Promise<Preference> {
    return prisma.preference.update({
      where: {
        user_id: userId
      },
      data
    });
  }

  async deletePreference(userId: number): Promise<void> {
    await prisma.preference.delete({
      where: {
        user_id: userId
      }
    });
  }
}

export { PreferenceRepo };
export default new PreferenceRepo();
