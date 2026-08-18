import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.cbtSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 1
  });
  console.log(JSON.stringify(s[0], null, 2));
  await prisma.$disconnect();
}
main();
