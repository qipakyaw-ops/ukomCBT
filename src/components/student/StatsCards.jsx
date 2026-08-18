import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, FileQuestion, Award, Flame } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';
import { useAuth } from '@/lib/AuthContext';
import questionClient from '@/api/questionClient';
import { getTargets, loadTargets } from '@/lib/userSettingsStore';

const emptyArray = [];

function calculateSessionPercentage(session, questionsById) {
  const answers = session.answers ?? {};
  let correctCount = 0;
  let total = 0;

  session.questionIds.forEach((questionId) => {
    const answer = answers[questionId];
    const question = questionsById.get(questionId);
    if (question) {
      total++;
      if (answer === question.correctAnswer) correctCount++;
    }
  });

  return total > 0 ? Math.round((correctCount / total) * 100) : 0;
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
  const { user } = useAuth();
  const [sessions, setSessions] = useState(emptyArray);
  const [questionsById, setQuestionsById] = useState(() => new Map());
  const [targetSessions, setTargetSessions] = useState(getTargets().sessionGoal);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setSessions(emptyArray);
        return;
      }
      try {
        const data = await getSubmittedCbtSessions(user.id);
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) setSessions(emptyArray);
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
    if (!user?.id) return;
    let cancelled = false;
    loadTargets(user.id).then((t) => {
      if (!cancelled) setTargetSessions(t.sessionGoal);
    });
    const onUpdate = () => setTargetSessions(getTargets().sessionGoal);
    window.addEventListener('userSettingsUpdated', onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('userSettingsUpdated', onUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    questionClient.getQuestions({ limit: 1000 })
      .then((res) => setQuestionsById(new Map(res.questions.map((q) => [q.id, q]))))
      .catch(() => {});
  }, []);

  const { stats } = useMemo(() => {
    const submittedCount = sessions.length;
    const totalQuestions = sessions.reduce((sum, session) => sum + session.questionIds.length, 0);
    const latestSession = sessions[0];
    const latestScore = latestSession ? calculateSessionPercentage(latestSession, questionsById) : 0;
    const streak = getStreak(sessions);
    const progress = targetSessions > 0 ? Math.min(100, Math.round((submittedCount / targetSessions) * 100)) : 0;

    return {
      stats: [
        { label: 'Progress Belajar', value: progress, suffix: '%', icon: TrendingUp, tone: 'bg-primary/10 text-primary' },
        { label: 'Total Soal Dikerjakan', value: totalQuestions.toLocaleString('id-ID'), suffix: 'soal', icon: FileQuestion, tone: 'bg-chart-2/10 text-chart-2' },
        { label: 'Nilai Terakhir', value: latestScore, suffix: '/100', icon: Award, tone: 'bg-chart-3/10 text-chart-3' },
        { label: 'Streak Belajar', value: streak, suffix: 'hari', icon: Flame, tone: 'bg-amber-500/10 text-amber-600' },
      ],
    };
  }, [sessions, questionsById, targetSessions]);

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
