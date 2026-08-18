import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';
import { useAuth } from '@/lib/AuthContext';
import questionClient from '@/api/questionClient';

function getSessionPercentage(session, questionById) {
  const answers = session.answers ?? {};
  let correctCount = 0;
  let total = 0;

  session.questionIds.forEach((questionId) => {
    const answer = answers[questionId];
    const question = questionById.get(questionId);
    if (question) {
      total++;
      if (answer === question.correctAnswer) correctCount++;
    }
  });

  return total > 0 ? Math.round((correctCount / total) * 100) : 0;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground">Skor: <span className="font-bold text-primary">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
}

const TIME_FILTERS = [
  { key: 'all', label: 'Semua Waktu' },
  { key: '7d', label: '7 Hari Terakhir' },
  { key: '30d', label: '30 Hari Terakhir' },
];

function matchesTimeRange(session, timeFilter) {
  if (timeFilter === 'all') return true;
  const ts = new Date(session.submittedAt ?? session.createdAt).getTime();
  const day = 24 * 60 * 60 * 1000;
  const cutoff = timeFilter === '7d' ? 7 * day : 30 * day;
  return ts >= Date.now() - cutoff;
}

export default function ProgressChart() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [questionById, setQuestionById] = useState(() => new Map());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setSessions([]);
        return;
      }
      try {
        const data = await getSubmittedCbtSessions(user.id);
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) setSessions([]);
      }
    };
    load();
    const refresh = () => load();
    window.addEventListener('cbtSessionsRefreshed', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('cbtSessionsRefreshed', refresh);
    };
  }, [user?.id]);

  useEffect(() => {
    questionClient.getQuestions({ limit: 1000 })
      .then((res) => setQuestionById(new Map(res.questions.map((q) => [q.id, q]))))
      .catch(() => {});
  }, []);

  const chartData = useMemo(() => {
    return sessions
      .filter((session) => matchesTimeRange(session, timeFilter))
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .map((session) => ({
        tanggal: formatDate(session.submittedAt),
        nilai: getSessionPercentage(session, questionById),
      }));
  }, [sessions, timeFilter, questionById]);

  const deltaText = useMemo(() => {
    if (chartData.length < 2) return 'Tambahkan lebih banyak sesi untuk melihat tren.';
    const diff = chartData[chartData.length - 1].nilai - chartData[0].nilai;
    return `${diff >= 0 ? '+' : ''}${diff} poin sejak sesi pertama`;
  }, [chartData]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-base font-bold">Grafik Perkembangan</h3>
          <p className="text-xs text-muted-foreground">Perkembangan skor dari sesi yang disubmit</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {TIME_FILTERS.map((f) => (
              <button key={f.key} type="button" onClick={() => setTimeFilter(f.key)} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${timeFilter === f.key ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
            {deltaText}
          </span>
        </div>
      </div>
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
            {sessions.length === 0 ? 'Belum ada sesi yang disubmit.' : 'Tidak ada sesi dalam rentang waktu ini.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="tanggal" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={CustomTooltip} />
              <Area type="monotone" dataKey="nilai" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#scoreGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
