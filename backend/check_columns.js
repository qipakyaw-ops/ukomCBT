import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'cbt_sessions'`;
  console.log(columns);
  await prisma.$disconnect();
}
main();
