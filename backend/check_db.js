
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.question.count();
  console.log(`Questions count: ${count}`);
  const sample = await prisma.question.findMany({ take: 1 });
  console.log('Sample record:', JSON.stringify(sample, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
