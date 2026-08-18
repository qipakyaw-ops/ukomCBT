import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.cbtSession.findUnique({
    where: { id: 'a7038062-9819-4513-86a6-340858357a3d' }
  });
  console.log('SESSION:', JSON.stringify(s, null, 2));
  if (s) {
    const q = await prisma.question.findMany({
      where: { id: { in: s.questionIds } }
    });
    console.log('QUESTIONS:', JSON.stringify(q, null, 2));
  }
  await prisma.$disconnect();
}
main();
