import { prisma } from "@/src/lib/prisma";
import { Prisma, Session, User, UserStatus } from "@/generated/prisma/client";

class AuthRepo {
  async getUser({
    id,
    email
  }: {
    id?: string;
    email?: string;
  }): Promise<User | null> {
    if (id && email) {
      return prisma.user.findFirst({
        where: {
          OR: [{ id }, { email }]
        }
      });
    }

    if (id) {
      return prisma.user.findUnique({
        where: { id }
      });
    }

    if (email) {
      return prisma.user.findUnique({
        where: { email }
      });
    }

    return null;
  }

  async getUsers({
    page,
    limit
  }: {
    page: number;
    limit: number;
  }): Promise<User[]> {
    const skip = (page - 1) * limit;

    return prisma.user.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async createUser({
    name,
    email,
    passwordHash
  }: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        status: UserStatus.INACTIVE,
        isVerified: false
      }
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async markUserAsVerified(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date()
      }
    });
  }

  async createSession({
    userId,
    refreshToken,
    expiresAt
  }: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt
      }
    });
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: {
        refreshToken
      }
    });
  }

  async getSessionById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { id }
    });
  }

  async rotateSession({
    sessionId,
    refreshToken,
    expiresAt
  }: {
    sessionId: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken,
        expiresAt
      }
    });
  }

  async deleteSessionById(id: string): Promise<void> {
    await prisma.session.delete({
      where: { id }
    });
  }

  async deleteSessionByRefreshToken(refreshToken: string): Promise<void> {
    await prisma.session.delete({
      where: {
        refreshToken
      }
    });
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId
      }
    });
  }
}

export { AuthRepo };
export default new AuthRepo();
