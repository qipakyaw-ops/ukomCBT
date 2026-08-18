import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';
import { useAuth } from '@/lib/AuthContext';
import questionClient from '@/api/questionClient';

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

function getSessionPercentage(session, questionsById) {
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

export default function CbtHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [questionsById, setQuestionsById] = useState(() => new Map());

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
      } catch (err) {
        console.error('[CbtHistory] Failed to load:', err);
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
      .then((res) => setQuestionsById(new Map(res.questions.map((q) => [q.id, q]))))
      .catch(() => {});
  }, []);

  const averageScore = Math.round(sessions.reduce((sum, session) => sum + getSessionPercentage(session, questionsById), 0) / sessions.length);
  const hasSessions = sessions.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-heading text-base font-bold">Riwayat CBT</h3>
        <Link to="/student/riwayat" className="text-sm font-medium text-primary hover:underline">
          Lihat semua
        </Link>
      </div>
      <div className="divide-y divide-border">
        {!hasSessions ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Belum ada sesi CBT yang disubmit.</div>
        ) : sessions.map((session) => {
          const score = getSessionPercentage(session, questionsById);
          const passed = score >= PASSING_GRADE;
          const title = session.config?.kategori || 'Sesi CBT';
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
                  <span>{score}/{session.questionIds.length} benar</span>
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
