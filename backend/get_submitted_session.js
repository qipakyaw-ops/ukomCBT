import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getSubmitted() {
  try {
    const sessions = await prisma.cbtSession.findMany({
      where: { submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      take: 1
    });
    console.log(JSON.stringify(sessions[0], null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
getSubmitted();
