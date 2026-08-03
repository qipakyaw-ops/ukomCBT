import React, { useEffect, useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

const STORAGE_KEY = 'study_targets_config';

const DEFAULT_TARGETS = {
  sessionGoal: 8,
  scoreGoal: 85,
};

function loadTargets() {
  if (typeof window === 'undefined') return DEFAULT_TARGETS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TARGETS;
    const parsed = JSON.parse(raw);
    return {
      sessionGoal: Number.isFinite(parsed.sessionGoal) && parsed.sessionGoal > 0 ? parsed.sessionGoal : DEFAULT_TARGETS.sessionGoal,
      scoreGoal: Number.isFinite(parsed.scoreGoal) && parsed.scoreGoal > 0 ? parsed.scoreGoal : DEFAULT_TARGETS.scoreGoal,
    };
  } catch {
    return DEFAULT_TARGETS;
  }
}

function saveTargets(value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

export default function StudyTargets() {
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [sessionGoalInput, setSessionGoalInput] = useState(DEFAULT_TARGETS.sessionGoal);
  const [scoreGoalInput, setScoreGoalInput] = useState(DEFAULT_TARGETS.scoreGoal);

  useEffect(() => {
    const loaded = loadTargets();
    setTargets(loaded);
    setSessionGoalInput(loaded.sessionGoal);
    setScoreGoalInput(loaded.scoreGoal);
  }, []);

  const sessions = useMemo(() => getSubmittedCbtSessions(), []);
  const completedSessions = sessions.length;
  const averageScore = useMemo(() => {
    if (!sessions.length) return 0;
    const total = sessions.reduce((sum, session) => {
      const score = session.result?.correctCount && session.result?.totalQuestions
        ? Math.round((session.result.correctCount / session.result.totalQuestions) * 100)
        : 0;
      return sum + score;
    }, 0);
    return Math.round(total / sessions.length);
  }, [sessions]);

  const sessionProgress = Math.min(100, Math.round((completedSessions / targets.sessionGoal) * 100));
  const scoreProgress = Math.min(100, Math.round((averageScore / targets.scoreGoal) * 100));

  const handleSaveTargets = () => {
    const nextTargets = {
      sessionGoal: Math.max(1, Number(sessionGoalInput) || DEFAULT_TARGETS.sessionGoal),
      scoreGoal: Math.max(1, Number(scoreGoalInput) || DEFAULT_TARGETS.scoreGoal),
    };
    setTargets(nextTargets);
    saveTargets(nextTargets);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-4 w-4" />
        </div>
        <h3 className="font-heading text-base font-bold">Target Belajar</h3>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium leading-tight">Selesaikan sesi CBT</span>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {completedSessions}/{targets.sessionGoal} sesi
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${sessionProgress}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium leading-tight">Skor rata-rata target</span>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {averageScore}/{targets.scoreGoal}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${scoreProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-border bg-muted p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-muted-foreground">
            Target sesi
            <input
              type="number"
              min="1"
              value={sessionGoalInput}
              onChange={(event) => setSessionGoalInput(Number(event.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <label className="space-y-1 text-sm text-muted-foreground">
            Target skor
            <input
              type="number"
              min="1"
              value={scoreGoalInput}
              onChange={(event) => setScoreGoalInput(Number(event.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleSaveTargets}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Simpan target
        </button>
      </div>
    </div>
  );
}
