const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.question.count();
  console.log('DB Count:', count);
  const q = await prisma.question.findMany({take: 1});
  console.log('Sample:', JSON.stringify(q));
}
main().finally(async () => await prisma.\());
