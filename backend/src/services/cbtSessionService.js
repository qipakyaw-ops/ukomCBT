import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CbtSessionService {
  async createSession(userId, sessionData) {
    console.log('DEBUG_PRISMA_CREATE: userId:', userId, 'Data:', JSON.stringify(sessionData));
    const result = await prisma.cbtSession.create({
      data: {
        userId,
        ...sessionData
      }
    });
    console.log('DEBUG_PRISMA_RESULT: Session ID created:', result.id);
    return result;
  }

  async updateSession(sessionId, userId, updates) {
    // ponytail: verifikasi kepemilikan sesi sebelum update karena Prisma update hanya bisa via unique ID
    const session = await prisma.cbtSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId) {
      throw new Error('Unauthorized atau Sesi tidak ditemukan');
    }

    return await prisma.cbtSession.update({
      where: { id: sessionId },
      data: updates
    });
  }

  async getSessionById(sessionId, userId) {
    // Diagnostic logging
    const rawResult = await prisma.$queryRaw`
      SELECT id, "userId", status, "submittedAt", "updated_at"
      FROM cbt_sessions
      WHERE id = ${sessionId}
    `;
    console.log('DIAGNOSTIC_RAW_SQL:', JSON.stringify(rawResult));

    const session = await prisma.cbtSession.findUnique({
      where: { id: sessionId }
    });
    console.log('DIAGNOSTIC_PRISMA_RESULT:', JSON.stringify(session));

    // ponytail: verifikasi kepemilikan setelah fetch karena schema tidak punya compound unique index
    if (session && session.userId !== userId) {
      return null;
    }
    return session;
  }

  async getSessionsByUser(userId) {
    return await prisma.cbtSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSubmittedSessionsByUser(userId) {
    return await prisma.cbtSession.findMany({
      where: { userId, status: 'submitted' },
      orderBy: { submittedAt: 'desc' }
    });
  }
}

export default new CbtSessionService();
