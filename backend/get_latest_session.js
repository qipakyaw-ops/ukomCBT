
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getLatest() {
  try {
    const session = await prisma.cbtSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    console.log(JSON.stringify(session[0], null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
getLatest();
