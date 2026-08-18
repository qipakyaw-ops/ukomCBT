import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PASSING_GRADE = 60;
const WEAK_ACCURACY_THRESHOLD = 30; // questions below this accuracy need evaluation
const REPORT_LIMIT = 1000;

// Load correct answers for grading.
async function loadAnswerMap() {
  const questions = await prisma.question.findMany({
    select: { id: true, correctAnswer: true, category: true, question: true },
  });
  const map = {};
  questions.forEach((q) => { map[q.id] = q; });
  return map;
}

// Filter sessions by submittedAt period: '30d' | 'month' | 'all'
function inPeriod(dateValue, period) {
  if (period === 'all') return true;
  const ts = new Date(dateValue).getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (period === '30d') return ts >= now - 30 * day;
  if (period === 'month') {
    const d = new Date();
    return ts >= new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  return true;
}

function sessionPercentage(session, answerMap) {
  let correct = 0;
  let total = 0;
  const answers = session.answers ?? {};
  Object.entries(answers).forEach(([qid, chosen]) => {
    if (!chosen) return;
    total += 1;
    if (answerMap[qid] && chosen === answerMap[qid].correctAnswer) correct += 1;
  });
  return total ? Math.round((correct / total) * 100) : 0;
}

// Aggregate report for admin Laporan view.
async function getReport(period = 'all') {
  const [answerMap, questions, sessions] = await Promise.all([
    loadAnswerMap(),
    prisma.question.findMany(),
    prisma.cbtSession.findMany({
      where: { status: 'submitted' },
      select: { id: true, type: true, answers: true, questionIds: true, submittedAt: true },
      take: REPORT_LIMIT,
    }),
  ]);

  const filtered = sessions.filter((s) => inPeriod(s.submittedAt ?? s.createdAt, period));

  // --- Summary metrics ---
  const totalSessions = filtered.length;
  const examSessions = filtered.filter((s) => s.type === 'exam');
  const examScores = examSessions.map((s) => sessionPercentage(s, answerMap));
  const passedExams = examScores.filter((score) => score >= PASSING_GRADE).length;
  const nationalPassRate = examScores.length ? Math.round((passedExams / examScores.length) * 100) : 0;
  const nationalAvg = examScores.length ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length) : 0;

  // --- Per-category performance ---
  const catAcc = {};
  filtered.forEach((s) => {
    const answers = s.answers ?? {};
    (s.questionIds || []).forEach((qid) => {
      const q = answerMap[qid];
      if (!q || !q.category) return;
      const c = catAcc[q.category] || { attempts: 0, correct: 0 };
      const chosen = answers[qid];
      if (!chosen) return;
      c.attempts += 1;
      if (chosen === q.correctAnswer) c.correct += 1;
      catAcc[q.category] = c;
    });
  });
  const categoryPerformance = Object.entries(catAcc)
    .map(([category, c]) => ({
      category,
      attempts: c.attempts,
      accuracy: c.attempts ? Math.round((c.correct / c.attempts) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // --- Hardest questions ---
  const qAcc = {};
  filtered.forEach((s) => {
    const answers = s.answers ?? {};
    (s.questionIds || []).forEach((qid) => {
      const chosen = answers[qid];
      if (!chosen) return;
      const c = qAcc[qid] || { attempts: 0, correct: 0 };
      c.attempts += 1;
      if (answerMap[qid] && chosen === answerMap[qid].correctAnswer) c.correct += 1;
      qAcc[qid] = c;
    });
  });
  const questionStats = Object.entries(qAcc)
    .map(([qid, c]) => {
      const q = answerMap[qid];
      return {
        id: qid,
        question: q?.question ?? '(soal terhapus)',
        category: q?.category ?? '-',
        attempts: c.attempts,
        correct: c.correct,
        accuracy: c.attempts ? Math.round((c.correct / c.attempts) * 100) : 0,
        failureRate: c.attempts ? Math.round(((c.attempts - c.correct) / c.attempts) * 100) : 0,
      };
    })
    .sort((a, b) => b.failureRate - a.failureRate);

  const hardestQuestions = questionStats.slice(0, 10);
  const weakQuestions = questionStats.filter((q) => q.accuracy < WEAK_ACCURACY_THRESHOLD);
  const soalPerluEvaluasi = weakQuestions.length;

  return {
    summary: {
      totalSessions,
      nationalPassRate,
      nationalAvg,
      soalPerluEvaluasi,
      passingGrade: PASSING_GRADE,
    },
    categoryPerformance,
    hardestQuestions,
  };
}

// CSV export: student performance summary rows.
async function getStudentExport(period = 'all') {
  const [answerMap, sessions, users] = await Promise.all([
    loadAnswerMap(),
    prisma.cbtSession.findMany({
      where: { status: 'submitted' },
      select: { id: true, type: true, answers: true, questionIds: true, submittedAt: true, userId: true },
      take: REPORT_LIMIT,
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const filtered = sessions.filter((s) => inPeriod(s.submittedAt ?? s.createdAt, period));

  const rows = filtered.map((s) => {
    const user = userById.get(s.userId);
    return {
      Student: user?.name ?? '-',
      Email: user?.email ?? '-',
      Type: s.type === 'exam' ? 'Ujian' : 'Latihan',
      SubmittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : '',
      Score: sessionPercentage(s, answerMap),
      Status: sessionPercentage(s, answerMap) >= PASSING_GRADE ? 'Lulus' : 'Belum Lulus',
    };
  });
  return rows;
}

export default { getReport, getStudentExport, PASSING_GRADE };