import React, { useMemo } from 'react';
import { ArrowLeft, Award, CheckCircle2, CircleAlert, Clock3, FileText, Flag, RotateCcw, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import { questionStore } from '@/lib/questionStore';
import { getBookmarksForUser, getCbtSession } from '@/lib/cbtSessionStore';

const PASSING_GRADE = 70;

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return '-';
  const elapsedSeconds = Math.max(0, Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit ${seconds} detik`;
}

function getCategoryAnalysis(questions, answers) {
  const categories = questions.reduce((result, question) => {
    const current = result[question.kategori] ?? { name: question.kategori, total: 0, correct: 0 };
    const answer = answers[question.id];
    current.total += 1;
    if (answer && answer === question.jawabanBenar) current.correct += 1;
    result[question.kategori] = current;
    return result;
  }, {});

  return Object.values(categories)
    .map((category) => ({ ...category, percentage: Math.round((category.correct / category.total) * 100) }))
    .sort((a, b) => b.percentage - a.percentage || b.correct - a.correct);
}

export default function ExamResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = getCbtSession(sessionId);

  const questions = useMemo(() => {
    if (!session) return [];
    const questionsById = new Map(questionStore.getQuestions().map((question) => [question.id, question]));
    return session.questionIds.map((questionId) => questionsById.get(questionId)).filter(Boolean);
  }, [session]);

  const answers = session?.answers ?? {};
  const calculatedResult = useMemo(() => {
    if (!session) return null;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    questions.forEach((question) => {
      const answer = answers[question.id];
      if (!answer) unansweredCount += 1;
      else if (answer === question.jawabanBenar) correctCount += 1;
      else incorrectCount += 1;
    });

    const totalQuestions = questions.length;
    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      answeredCount: correctCount + incorrectCount,
      percentage: totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0,
    };
  }, [answers, questions, session]);

  const { user } = useAuth();
  const bookmarkCount = user?.id ? getBookmarksForUser(user.id).length : 0;
  const result = session?.result ? {
    ...calculatedResult,
    ...session.result,
    percentage: calculatedResult?.percentage ?? 0,
  } : calculatedResult;
  const categoryAnalysis = useMemo(() => getCategoryAnalysis(questions, answers), [answers, questions]);
  const strongestCategory = categoryAnalysis[0];
  const weakestCategory = categoryAnalysis[categoryAnalysis.length - 1];
  const isSubmitted = session?.status === 'submitted';
  const hasPassed = (result?.percentage ?? 0) >= PASSING_GRADE;

  if (!session || !isSubmitted || !result) {
    return (
      <CbtPageShell title="Hasil CBT" description="Hasil sesi tidak tersedia.">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <CircleAlert className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h2 className="mt-4 font-heading text-lg font-bold">Hasil belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Halaman ini hanya dapat dibuka setelah sesi CBT selesai dan disubmit.
          </p>
          <button type="button" onClick={() => navigate('/student/latihan')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:shadow-md">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Latihan
          </button>
        </div>
      </CbtPageShell>
    );
  }

  return (
    <CbtPageShell title="Hasil CBT" description="Tinjau skor, analisis kategori, dan pembahasan setiap soal.">
      <div className={`rounded-2xl border p-6 ${hasPassed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${hasPassed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {hasPassed ? <Award className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Status CBT</p>
              <h2 className={`mt-1 font-heading text-2xl font-bold ${hasPassed ? 'text-emerald-700' : 'text-destructive'}`}>{hasPassed ? 'Lulus' : 'Belum Lulus'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Passing grade: {PASSING_GRADE}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nilai</p>
            <p className={`mt-1 font-heading text-5xl font-extrabold ${hasPassed ? 'text-emerald-700' : 'text-destructive'}`}>{result.percentage}</p>
            <p className="text-sm text-muted-foreground">dari 100</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="mt-4 font-heading text-3xl font-bold">{result.correctCount}</p><p className="text-sm text-muted-foreground">Jumlah benar</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><XCircle className="h-5 w-5 text-destructive" /><p className="mt-4 font-heading text-3xl font-bold">{result.incorrectCount}</p><p className="text-sm text-muted-foreground">Jumlah salah</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><FileText className="h-5 w-5 text-amber-600" /><p className="mt-4 font-heading text-3xl font-bold">{result.unansweredCount}</p><p className="text-sm text-muted-foreground">Jumlah kosong</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><Award className="h-5 w-5 text-primary" /><p className="mt-4 font-heading text-3xl font-bold">{result.percentage}%</p><p className="text-sm text-muted-foreground">Persentase</p></div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /><h2 className="font-heading text-base font-bold">Detail Waktu</h2></div>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Lama mengerjakan</p><p className="mt-1 font-semibold">{formatDuration(session.startTime, session.submittedAt)}</p></div>
          <div><p className="text-xs text-muted-foreground">Waktu mulai</p><p className="mt-1 font-semibold">{formatDateTime(session.startTime)}</p></div>
          <div><p className="text-xs text-muted-foreground">Waktu selesai</p><p className="mt-1 font-semibold">{formatDateTime(session.submittedAt)}</p></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-bold">Analisis Kategori</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-500/10 p-4"><p className="text-xs text-muted-foreground">Kategori terkuat</p><p className="mt-2 font-semibold text-emerald-700">{strongestCategory?.name ?? '-'}</p><p className="mt-1 text-sm text-muted-foreground">{strongestCategory ? `${strongestCategory.percentage}% (${strongestCategory.correct}/${strongestCategory.total} benar)` : 'Belum ada data'}</p></div>
            <div className="rounded-xl bg-amber-500/10 p-4"><p className="text-xs text-muted-foreground">Kategori terlemah</p><p className="mt-2 font-semibold text-amber-700">{weakestCategory?.name ?? '-'}</p><p className="mt-1 text-sm text-muted-foreground">{weakestCategory ? `${weakestCategory.percentage}% (${weakestCategory.correct}/${weakestCategory.total} benar)` : 'Belum ada data'}</p></div>
          </div>
          <div className="mt-5 space-y-4">
            {categoryAnalysis.map((category) => (
              <div key={category.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium">{category.name}</span><span className="text-muted-foreground">{category.correct}/{category.total} benar</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${category.percentage}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-bold">Ringkasan Tambahan</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Total soal</span><span className="font-semibold">{result.totalQuestions}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Passing grade</span><span className="font-semibold">{PASSING_GRADE}</span></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Flag className="h-4 w-4" /> Flagged</span><span className="font-semibold">{session.flaggedQuestionIds?.length ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><RotateCcw className="h-4 w-4" /> Bookmark</span><span className="font-semibold">{bookmarkCount}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-heading text-base font-bold">Pembahasan Setiap Soal</h2><p className="mt-1 text-xs text-muted-foreground">Review jawaban dan rasionalitas dari setiap soal.</p></div><span className="text-xs text-muted-foreground">{questions.length} soal</span></div>
        <div className="mt-5 space-y-4">
          {questions.map((question, index) => {
            const answer = answers[question.id];
            const isCorrect = answer === question.jawabanBenar;
            const isEmpty = !answer;
            return (
              <article key={question.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs font-semibold text-primary">Soal {index + 1} · {question.kategori}</p><h3 className="mt-1 text-sm font-semibold leading-relaxed">{question.pertanyaan}</h3></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isEmpty ? 'bg-amber-500/10 text-amber-700' : isCorrect ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>{isEmpty ? 'Kosong' : isCorrect ? 'Benar' : 'Salah'}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p className="rounded-lg bg-muted/60 px-3 py-2">Jawaban kamu: <span className="font-semibold">{answer ?? '-'}</span></p><p className="rounded-lg bg-muted/60 px-3 py-2">Jawaban benar: <span className="font-semibold text-emerald-700">{question.jawabanBenar}</span></p></div>
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-relaxed"><p className="font-semibold text-primary">Pembahasan</p><p className="mt-1 text-muted-foreground">{question.pembahasan || 'Pembahasan belum tersedia.'}</p>{question.referensi && <p className="mt-2 text-xs text-muted-foreground">Referensi: {question.referensi}</p>}</div>
              </article>
            );
          })}
        </div>
      </div>
    </CbtPageShell>
  );
}
