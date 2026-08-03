import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

const PASSING_GRADE = 70;

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(start, end) {
  if (!start || !end) return '-';
  const diffMinutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${diffMinutes} menit`;
}

function getSessionPercentage(session) {
  const correct = session.result?.correctCount ?? 0;
  const total = session.result?.totalQuestions ?? session.questionIds?.length ?? 0;
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export default function CbtHistory() {
  const sessions = useMemo(() => getSubmittedCbtSessions(), []);
  const averageScore = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.round(sessions.reduce((sum, session) => sum + getSessionPercentage(session), 0) / sessions.length);
  }, [sessions]);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-heading text-base font-bold">Riwayat CBT</h3>
        <Link to="/student/riwayat" className="text-sm font-medium text-primary hover:underline">
          Lihat semua
        </Link>
      </div>
      <div className="divide-y divide-border">
        {sessions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Belum ada sesi CBT yang disubmit.</div>
        ) : sessions.map((session) => {
          const score = getSessionPercentage(session);
          const passed = score >= PASSING_GRADE;
          const title = session.config?.kategori || 'Sesi CBT';
          const correct = session.result?.correctCount ?? 0;
          const totalQuestions = session.result?.totalQuestions ?? session.questionIds?.length ?? 0;
          return (
            <div key={session.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
              }`}>
                {passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{title}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(session.submittedAt)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(session.startTime, session.submittedAt)}</span>
                  <span>•</span>
                  <span>{correct}/{totalQuestions} benar</span>
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
              }`}>
                {score}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5" /> {sessions.length} sesi tercatat • Rata-rata skor {averageScore}
        </p>
      </div>
    </div>
  );
}
