const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const count = await prisma.question.count();
    console.log('DB Count:', count);
    const q = await prisma.question.findMany({take: 3});
    console.log('Sample:', JSON.stringify(q));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.\();
  }
}
main();
