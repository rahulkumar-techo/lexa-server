import { prisma } from "@/src/lib/prisma";
import { File, Prisma } from "@/generated/prisma/client";

class FileRepo {
  async createFile(data: Prisma.FileUncheckedCreateInput): Promise<File> {
    return prisma.file.create({
      data
    });
  }
}

export { FileRepo };
export default new FileRepo();
