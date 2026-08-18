import React, { useEffect, useState } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';
import { getTargets, loadTargets } from '@/lib/userSettingsStore';
import questionClient from '@/api/questionClient';
import {
  getSchedule,
  loadSchedule,
  saveSchedule,
  buildRecommendedSchedule,
  buildInsightNote,
  normalizeSchedule,
} from '@/lib/studyScheduleStore';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getTodayLabel() {
  const mapping = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return mapping[new Date().getDay()];
}

export default function StudySchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(() => getSchedule());
  const [selectedDay, setSelectedDay] = useState(getTodayLabel());
  const [editorValue, setEditorValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [insightNote, setInsightNote] = useState(null);

  const refreshInsight = async (sessions = null) => {
    if (!user?.id) return;
    try {
      const [loadedSessions, targets] = await Promise.all([
        sessions ?? getSubmittedCbtSessions(user.id),
        loadTargets(user.id),
      ]);
      const { questions } = await questionClient.getQuestions({ limit: 1000 });
      const questionById = new Map(questions.map((q) => [q.id, q]));
      setInsightNote(buildInsightNote(loadedSessions, questionById, targets?.scoreGoal ?? 85));
    } catch (error) {
      console.error('[StudySchedule] Insight failed:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    loadSchedule(user.id).then((sched) => {
      if (cancelled) return;
      setSchedule(sched);
    });
    refreshInsight();
    const onSessions = () => refreshInsight();
    window.addEventListener('cbtSessionsRefreshed', onSessions);
    return () => {
      cancelled = true;
      window.removeEventListener('cbtSessionsRefreshed', onSessions);
    };
  }, [user?.id]);

  useEffect(() => {
    const current = schedule.find((entry) => entry.day === selectedDay);
    setEditorValue(current?.items.join('\n') ?? '');
  }, [schedule, selectedDay]);

  const handleSave = async () => {
    const nextSchedule = schedule.map((entry) => {
      if (entry.day !== selectedDay) return entry;
      return {
        ...entry,
        items: editorValue.split('\n').map((item) => item.trim()).filter(Boolean),
      };
    });
    setSchedule(nextSchedule);
    setSaveStatus('saving');
    try {
      const saved = await saveSchedule(user?.id, nextSchedule);
      setSchedule(saved);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleGenerate = async () => {
    if (!user?.id) return;
    setIsGenerating(true);
    setSaveStatus(null);
    try {
      const [sessions, targets] = await Promise.all([
        getSubmittedCbtSessions(user.id),
        loadTargets(user.id),
      ]);
      const { questions } = await questionClient.getQuestions({ limit: 1000 });
      const questionById = new Map(questions.map((q) => [q.id, q]));
      const recommended = buildRecommendedSchedule(
        sessions,
        questionById,
        targets?.sessionGoal ?? 8,
        targets?.scoreGoal ?? 85,
      );
      const saved = await saveSchedule(user.id, recommended);
      setSchedule(saved);
      await refreshInsight(sessions);
      setSaveStatus('generated');
    } catch (error) {
      console.error('[StudySchedule] Generate failed:', error);
      setSaveStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold">Jadwal Belajar</h3>
            <p className="text-xs text-muted-foreground">Rekomendasi AI personal berdasarkan performa kamu</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isGenerating ? 'Menyusun...' : 'Generate Rekomendasi AI'}
        </button>
      </div>
      {saveStatus === 'generated' && <p className="mb-3 text-xs font-medium text-emerald-600">Rekomendasi AI telah dibuat dan disimpan.</p>}
      {saveStatus === 'saved' && <p className="mb-3 text-xs font-medium text-emerald-600">Jadwal tersimpan.</p>}
      {saveStatus === 'error' && <p className="mb-3 text-xs font-medium text-destructive">Gagal menyimpan jadwal.</p>}

      {insightNote && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm leading-relaxed">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground"><span className="font-semibold text-foreground">Insight AI:</span> {insightNote}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {DAYS.map((day) => {
          const entry = schedule.find((s) => s.day === day);
          const isToday = day === getTodayLabel();
          const count = entry?.items.length ?? 0;
          return (
            <button
              type="button"
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all ${
                day === selectedDay ? 'border-primary bg-primary/5' : isToday ? 'border-primary bg-accent ring-1 ring-primary/20' : 'border-border hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${day === selectedDay || isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</span>
                {count > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-bold text-primary">
                    {count}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {entry?.items.length ? entry.items.slice(0, 2).map((it, i) => (
                  <p key={i} className="text-[11px] leading-tight text-foreground/80 line-clamp-2">{it}</p>
                )) : (
                  <p className="text-[11px] text-muted-foreground/60">Libur</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">Edit jadwal {selectedDay}</h4>
            <p className="text-xs text-muted-foreground">Pisahkan setiap kegiatan dengan baris baru.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            Simpan
          </button>
        </div>
        <textarea
          rows={4}
          value={editorValue}
          onChange={(event) => setEditorValue(event.target.value)}
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>
    </div>
  );
}