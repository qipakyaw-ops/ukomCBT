import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Load correct answers for grading submitted sessions.
async function loadAnswerMap() {
  const questions = await prisma.question.findMany({
    select: { id: true, correctAnswer: true },
  });
  const map = {};
  questions.forEach((q) => { map[q.id] = q.correctAnswer; });
  return map;
}

function gradeSessions(sessions, answerMap) {
  let totalCorrect = 0;
  let totalAnswered = 0;
  sessions.forEach((s) => {
    const answers = s.answers ?? {};
    Object.entries(answers).forEach(([qid, chosen]) => {
      if (!chosen) return;
      totalAnswered += 1;
      if (answerMap[qid] && chosen === answerMap[qid]) totalCorrect += 1;
    });
  });
  return { totalCorrect, totalAnswered };
}

// Aggregate metrics for the admin dashboard.
async function getDashboardStats() {
  const [studentCount, questionCount, submittedCount, sessions, answerMap] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.question.count(),
    prisma.cbtSession.count({ where: { status: 'submitted' } }),
    prisma.cbtSession.findMany({
      where: { status: 'submitted' },
      select: { answers: true, questionIds: true, createdAt: true, submittedAt: true },
    }),
    loadAnswerMap(),
  ]);

  // Start of today (local server time).
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Latihan Hari Ini: submitted sessions today.
  const todayCount = sessions.filter((s) => {
    const d = new Date(s.submittedAt ?? s.createdAt);
    return d >= startOfDay;
  }).length;

  // Average score across all submitted sessions (graded against correct answers).
  const { totalCorrect, totalAnswered } = gradeSessions(sessions, answerMap);
  const avgScore = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return {
    totalStudent: studentCount,
    bankSoal: questionCount,
    latihanHariIni: todayCount,
    rataRataSkor: avgScore,
  };
}

// Recent student registrations with completed-session counts and average scores.
async function getRecentStudents(limit = 5) {
  const [students, answerMap] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    loadAnswerMap(),
  ]);

  const rows = await Promise.all(students.map(async (student) => {
    const [sessions, aggregate] = await Promise.all([
      prisma.cbtSession.findMany({
        where: { userId: student.id, status: 'submitted' },
        select: { answers: true, questionIds: true },
      }),
      prisma.cbtSession.aggregate({
        where: { userId: student.id, status: 'submitted' },
        _count: { _all: true },
      }),
    ]);

    const { totalCorrect, totalAnswered } = gradeSessions(sessions, answerMap);

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      tests: aggregate._count._all,
      avg: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      joined: student.createdAt.toISOString(),
    };
  }));

  return rows;
}

// Question count grouped by category.
async function getCategoryDistribution() {
  const grouped = await prisma.question.groupBy({
    by: ['category'],
    _count: { _all: true },
    orderBy: { category: 'asc' },
  });
  return grouped.map((g) => ({
    category: g.category,
    count: g._count._all,
  }));
}

export default {
  getDashboardStats,
  getRecentStudents,
  getCategoryDistribution,
};