import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CbtBookmarkService {
  async getBookmarks(userId) {
    return await prisma.cbtBookmark.findMany({
      where: { userId },
      select: { questionId: true }
    });
  }

  async addBookmark(userId, questionId) {
    return await prisma.cbtBookmark.create({
      data: { userId, questionId }
    });
  }

  async removeBookmark(userId, questionId) {
    return await prisma.cbtBookmark.delete({
      where: { userId_questionId: { userId, questionId } }
    });
  }
}

export default new CbtBookmarkService();
