import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

function getSessionPercentage(session) {
  const correct = session.result?.correctCount ?? 0;
  const total = session.result?.totalQuestions ?? session.questionIds?.length ?? 0;
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
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

export default function ProgressChart() {
  const sessions = useMemo(() => getSubmittedCbtSessions(), []);

  const chartData = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .map((session) => ({
        tanggal: formatDate(session.submittedAt),
        nilai: getSessionPercentage(session),
      }));
  }, [sessions]);

  const deltaText = useMemo(() => {
    if (chartData.length < 2) return 'Tambahkan lebih banyak sesi untuk melihat tren.';
    const diff = chartData[chartData.length - 1].nilai - chartData[0].nilai;
    return `${diff >= 0 ? '+' : ''}${diff} poin sejak sesi pertama`;
  }, [chartData]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-bold">Grafik Perkembangan</h3>
          <p className="text-xs text-muted-foreground">Perkembangan skor dari sesi yang disubmit</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
          {deltaText}
        </span>
      </div>
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
            Belum ada sesi yang disubmit.
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
