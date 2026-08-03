import React, { useMemo } from 'react';
import { Award, BarChart3, CheckCircle2, Clock3, FileQuestion, Gauge, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import { questionStore } from '@/lib/questionStore';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

const PASSING_GRADE = 70;
const CATEGORY_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function getSessionPercentage(session) {
  const result = session.result ?? {};
  if (typeof result.percentage === 'number') return result.percentage;
  const total = result.totalQuestions ?? session.questionIds?.length ?? 0;
  return total ? Math.round(((result.correctCount ?? 0) / total) * 100) : 0;
}

function getDurationSeconds(session) {
  if (!session.startTime || !session.submittedAt) return 0;
  return Math.max(0, Math.floor((new Date(session.submittedAt).getTime() - new Date(session.startTime).getTime()) / 1000));
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
}

function formatShortDate(value) {
  return value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-';
}

function CustomTooltip({ active, payload, label, valueLabel = 'Nilai' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">{valueLabel}: <span className="font-bold text-primary">{payload[0].value}%</span></p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = 'text-primary' }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ${tone}`}><Icon className="h-5 w-5" /></div>
      <p className="mt-4 font-heading text-3xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Performance() {
  const sessions = getSubmittedCbtSessions();
  const questions = questionStore.getQuestions();

  const analytics = useMemo(() => {
    const questionById = new Map(questions.map((question) => [question.id, question]));
    const totalCbt = sessions.length;
    const scores = sessions.map(getSessionPercentage);
    const totalTimeSeconds = sessions.reduce((sum, session) => sum + getDurationSeconds(session), 0);
    const passedCount = scores.filter((score) => score >= PASSING_GRADE).length;
    const averageScore = totalCbt ? Math.round(scores.reduce((sum, score) => sum + score, 0) / totalCbt) : 0;
    const categoryTotals = {};

    sessions.forEach((session) => {
      const answers = session.answers ?? {};
      session.questionIds.forEach((questionId) => {
        const question = questionById.get(questionId);
        if (!question) return;
        const category = categoryTotals[question.kategori] ?? { kategori: question.kategori, correct: 0, total: 0 };
        category.total += 1;
        if (answers[questionId] === question.jawabanBenar) category.correct += 1;
        categoryTotals[question.kategori] = category;
      });
    });

    const categoryData = Object.values(categoryTotals)
      .map((category) => ({ ...category, persentase: category.total ? Math.round((category.correct / category.total) * 100) : 0 }))
      .sort((a, b) => b.persentase - a.persentase);

    return {
      totalCbt,
      averageScore,
      highestScore: totalCbt ? Math.max(...scores) : 0,
      lowestScore: totalCbt ? Math.min(...scores) : 0,
      totalTimeSeconds,
      passRate: totalCbt ? Math.round((passedCount / totalCbt) * 100) : 0,
      progressData: [...sessions].reverse().map((session, index) => ({ sesi: `S${index + 1}`, tanggal: formatShortDate(session.submittedAt), nilai: getSessionPercentage(session) })),
      categoryData,
    };
  }, [questions, sessions]);

  if (sessions.length === 0) {
    return (
      <CbtPageShell title="Performa" description="Pantau perkembangan belajar berdasarkan hasil CBT.">
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h2 className="mt-4 font-heading text-lg font-bold">Analytics belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Selesaikan dan submit sesi CBT untuk melihat perkembangan nilai, waktu belajar, dan kategori.</p>
        </div>
      </CbtPageShell>
    );
  }

  return (
    <CbtPageShell title="Performa" description="Pantau perkembangan belajar dari seluruh sesi CBT yang sudah disubmit.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={FileQuestion} label="Total CBT" value={analytics.totalCbt} />
        <MetricCard icon={Gauge} label="Rata-rata nilai" value={analytics.averageScore} tone="text-chart-2" />
        <MetricCard icon={Award} label="Nilai tertinggi" value={analytics.highestScore} tone="text-emerald-600" />
        <MetricCard icon={TrendingUp} label="Nilai terendah" value={analytics.lowestScore} tone="text-amber-600" />
        <MetricCard icon={Clock3} label="Total waktu belajar" value={formatDuration(analytics.totalTimeSeconds)} tone="text-chart-3" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="font-heading text-base font-bold">Grafik Perkembangan</h2><p className="text-xs text-muted-foreground">Tren nilai dari sesi terlama ke terbaru</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><TrendingUp className="h-3.5 w-3.5" /> {analytics.totalCbt} sesi</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.progressData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs><linearGradient id="analyticsScoreGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="sesi" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="nilai" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#analyticsScoreGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-heading text-base font-bold">Persentase Kelulusan</h2><p className="mt-1 text-xs text-muted-foreground">Passing grade {PASSING_GRADE}</p></div><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
          <div className="mt-8 text-center"><p className="font-heading text-5xl font-extrabold text-emerald-600">{analytics.passRate}%</p><p className="mt-2 text-sm text-muted-foreground">sesi lulus</p></div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${analytics.passRate}%` }} /></div>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>{sessions.filter((session) => getSessionPercentage(session) >= PASSING_GRADE).length} lulus</span><span>{sessions.filter((session) => getSessionPercentage(session) < PASSING_GRADE).length} belum lulus</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-heading text-base font-bold">Grafik Kategori</h2><p className="text-xs text-muted-foreground">Akurasi jawaban pada seluruh sesi</p></div><BarChart3 className="h-5 w-5 text-primary" /></div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.categoryData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="kategori" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-15} textAnchor="end" height={55} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip valueLabel="Akurasi" />} />
              <Bar dataKey="persentase" radius={[6, 6, 0, 0]}>
                {analytics.categoryData.map((entry, index) => <Cell key={entry.kategori} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CbtPageShell>
  );
}
