import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.cbtSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 2
  });
  console.log(JSON.stringify(sessions, null, 2));
  await prisma.$disconnect();
}
main();
