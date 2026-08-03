import React, { useMemo } from 'react';
import { TrendingUp, FileQuestion, Award, Flame } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

const STUDY_TARGET_KEY = 'study_target_sessions';

function parseTargetSessions() {
  if (typeof window === 'undefined') return 10;
  const stored = window.localStorage.getItem(STUDY_TARGET_KEY);
  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

function getSessionPercentage(session) {
  const correct = session.result?.correctCount ?? 0;
  const total = session.result?.totalQuestions ?? session.questionIds?.length ?? 0;
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function getStreak(sessions) {
  const uniqueDates = Array.from(new Set(sessions.map((session) => new Date(session.submittedAt ?? session.createdAt).toDateString())));
  if (!uniqueDates.length) return 0;
  uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i += 1) {
    const nextDate = new Date(uniqueDates[i]);
    const diffDays = Math.round((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
      currentDate = nextDate;
    } else {
      break;
    }
  }

  return streak;
}

export default function StatsCards() {
  const { stats } = useMemo(() => {
    const sessions = getSubmittedCbtSessions();
    const submittedCount = sessions.length;
    const totalQuestions = sessions.reduce((sum, session) => sum + (session.result?.answeredCount ?? session.questionIds?.length ?? 0), 0);
    const latestSession = sessions[0];
    const latestScore = latestSession ? getSessionPercentage(latestSession) : 0;
    const streak = getStreak(sessions);
    const targetSessions = parseTargetSessions();
    const progress = targetSessions > 0 ? Math.min(100, Math.round((submittedCount / targetSessions) * 100)) : 0;

    return {
      stats: [
        { label: 'Progress Belajar', value: progress, suffix: '%', icon: TrendingUp, tone: 'bg-primary/10 text-primary' },
        { label: 'Total Soal Dikerjakan', value: totalQuestions.toLocaleString('id-ID'), suffix: 'soal', icon: FileQuestion, tone: 'bg-chart-2/10 text-chart-2' },
        { label: 'Nilai Terakhir', value: latestScore, suffix: '/100', icon: Award, tone: 'bg-chart-3/10 text-chart-3' },
        { label: 'Streak Belajar', value: streak, suffix: 'hari', icon: Flame, tone: 'bg-amber-500/10 text-amber-600' },
      ],
    };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <p className="mt-4 font-heading text-3xl font-bold">
            {s.value}
            <span className="ml-1 text-sm font-medium text-muted-foreground">{s.suffix}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
