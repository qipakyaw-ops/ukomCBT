import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sampleQuestions = [
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'apa pengalaman nando',
    options: { A: 'lari', B: 'olahraga', C: 'berenang', D: 'jalan', E: 'lompat' },
    correctAnswer: 'A',
    vignette: 'nando adalah seorang paruh baya'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 2',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'B',
    vignette: 'vignette 2'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 3',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'C',
    vignette: 'vignette 3'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 4',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'D',
    vignette: 'vignette 4'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 5',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'E',
    vignette: 'vignette 5'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 6',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'A',
    vignette: 'vignette 6'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 7',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'B',
    vignette: 'vignette 7'
  },
  {
    category: 'Farmakologi',
    subcategory: 'test',
    difficulty: 'Sedang',
    type: 'normal',
    question: 'contoh soal 8',
    options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    correctAnswer: 'C',
    vignette: 'vignette 8'
  }
];

async function main() {
  for (const q of sampleQuestions) {
    await prisma.question.create({ data: q });
  }
  const count = await prisma.question.count();
  console.log('DB Count:', count);
  const sample = await prisma.question.findMany({ take: 1 });
  console.log('Sample:', JSON.stringify(sample[0], null, 2));
}
main();
