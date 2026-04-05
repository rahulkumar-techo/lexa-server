import { prisma } from "@/src/lib/prisma";
import { Prisma, Session, User, UserStatus } from "@/generated/prisma/client";

class AuthRepo {
  async getUser({
    id,
    email
  }: {
    id?: number;
    email?: string;
  }): Promise<User | null> {
    if (typeof id === "number" && email) {
      return prisma.user.findFirst({
        where: {
          OR: [{ id }, { email }]
        }
      });
    }

    if (typeof id === "number") {
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
        created_at: "desc"
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
        password_hash: passwordHash,
        status: UserStatus.INACTIVE,
        is_verified: false
      }
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async markUserAsVerified(id: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        is_verified: true,
        status: UserStatus.ACTIVE,
        email_verified_at: new Date()
      }
    });
  }

  async createSession({
    userId,
    refreshToken,
    expiresAt
  }: {
    userId: number;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data: {
        user_id: userId,
        refresh_token: refreshToken,
        expires_at: expiresAt
      }
    });
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: {
        refresh_token: refreshToken
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
        refresh_token: refreshToken,
        expires_at: expiresAt
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
        refresh_token: refreshToken
      }
    });
  }

  async deleteSessionsByUserId(userId: number): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        user_id: userId
      }
    });
  }
}

export { AuthRepo };
export default new AuthRepo();
