import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const s = await prisma.cbtSession.findUnique({
    where: { id: 'e88d55ff-3749-4875-952e-3159e56e0879' }
  });
  console.log(JSON.stringify(s, null, 2));
  await prisma.$disconnect();
}
check();
