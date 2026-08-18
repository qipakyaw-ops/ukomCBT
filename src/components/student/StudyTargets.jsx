import React, { useEffect, useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';
import { useAuth } from '@/lib/AuthContext';
import questionClient from '@/api/questionClient';
import { getTargets, loadTargets, saveTargets } from '@/lib/userSettingsStore';

const DEFAULT_TARGETS = { sessionGoal: 8, scoreGoal: 85 };

export default function StudyTargets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState(getTargets());
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [sessionGoalInput, setSessionGoalInput] = useState(targets.sessionGoal);
  const [scoreGoalInput, setScoreGoalInput] = useState(targets.scoreGoal);
  const [saveStatus, setSaveStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [questionsById, setQuestionsById] = useState(() => new Map());

  useEffect(() => {
    if (!user?.id) {
      setTargets(DEFAULT_TARGETS);
      setIsLoadingTargets(false);
      setSessions([]);
      return undefined;
    }
    let cancelled = false;
    loadTargets(user.id).then((loaded) => {
      if (cancelled) return;
      setTargets(loaded);
      setSessionGoalInput(loaded.sessionGoal);
      setScoreGoalInput(loaded.scoreGoal);
      setIsLoadingTargets(false);
    });
    const onUpdate = () => setTargets(getTargets());
    window.addEventListener('userSettingsUpdated', onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('userSettingsUpdated', onUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setSessions([]);
      return undefined;
    }
    let cancelled = false;
    getSubmittedCbtSessions(user.id).then((data) => {
      if (!cancelled) setSessions(data);
    });
    const refresh = () => getSubmittedCbtSessions(user.id).then((data) => setSessions(data));
    window.addEventListener('cbtSessionsRefreshed', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('cbtSessionsRefreshed', refresh);
    };
  }, [user?.id]);

  useEffect(() => {
    questionClient.getQuestions({ limit: 1000 })
      .then((res) => setQuestionsById(new Map(res.questions.map((q) => [q.id, q]))))
      .catch(() => {});
  }, []);

  const submittedSessions = sessions.filter((session) => session.status === 'submitted');

  // Current week = Monday 00:00 .. Sunday 23:59.
  const startOfWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun..6=Sat
    const mondayOffset = (day === 0 ? -6 : 1 - day);
    const start = new Date(now);
    start.setDate(now.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }, []);

  const weekSessions = submittedSessions.filter((s) => {
    const ts = new Date(s.submittedAt ?? s.createdAt).getTime();
    return ts >= startOfWeek;
  });
  const completedSessions = weekSessions.length;
  const averageScore = useMemo(() => {
    // Prefer current-week sessions; fall back to all-time if none this week yet.
    const base = weekSessions.length ? weekSessions : submittedSessions;
    if (!base.length) return 0;

    const calculateScoreForSession = (session) => {
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
    };

    const total = base.reduce((sum, session) => sum + calculateScoreForSession(session), 0);
    return Math.round(total / base.length);
  }, [submittedSessions, weekSessions, questionsById]);

  const sessionProgress = Math.min(100, Math.round((completedSessions / (targets.sessionGoal || 1)) * 100));
  const scoreProgress = Math.min(100, Math.round((averageScore / (targets.scoreGoal || 1)) * 100));

  const handleSaveTargets = async () => {
    const nextTargets = {
      sessionGoal: Math.max(1, Number(sessionGoalInput) || DEFAULT_TARGETS.sessionGoal),
      scoreGoal: Math.max(1, Number(scoreGoalInput) || DEFAULT_TARGETS.scoreGoal),
    };
    setSaveStatus('saving');
    try {
      const saved = await saveTargets(user?.id, nextTargets.sessionGoal, nextTargets.scoreGoal);
      setTargets(saved);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-4 w-4" />
        </div>
        <h3 className="font-heading text-base font-bold">Target Belajar</h3>
      </div>

      {isLoadingTargets ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
          Memuat target...
        </div>
      ) : (
        <>
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Minggu ini (Senin–Minggu)
            </span>
          </div>
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium leading-tight">Selesaikan Sesi Mingguan</span>
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
                Target Sesi / Minggu
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
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {saveStatus === 'saving' ? 'Menyimpan...' : 'Simpan target'}
            </button>
            {saveStatus === 'saved' && <p className="text-xs font-medium text-emerald-600">Target tersimpan.</p>}
            {saveStatus === 'error' && <p className="text-xs font-medium text-destructive">Gagal menyimpan target.</p>}
          </div>
        </>
      )}
    </div>
  );
}
