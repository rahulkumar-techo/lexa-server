import { prisma } from "@/src/lib/prisma";
import { Prisma, User } from "@/generated/prisma/client";

class UserRepo {
  async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }
}

export { UserRepo };
export default new UserRepo();
