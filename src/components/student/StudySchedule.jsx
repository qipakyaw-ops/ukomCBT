import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const STORAGE_KEY = 'study_schedule_plan';

const DEFAULT_SCHEDULE = [
  { day: 'Sen', items: ['Medikal Bedah — 60 mnt', 'Bank Soal — 30 soal'] },
  { day: 'Sel', items: ['Farmakologi — 45 mnt'] },
  { day: 'Rab', items: ['Simulasi CBT — 90 mnt'] },
  { day: 'Kam', items: ['Keperawatan Anak — 60 mnt'] },
  { day: 'Jum', items: ['Maternitas — 45 mnt', 'Pembahasan'] },
  { day: 'Sab', items: ['Simulasi CBT — 90 mnt'] },
  { day: 'Min', items: ['Review Bookmark'] },
];

function getTodayLabel() {
  const dayIndex = new Date().getDay();
  const mapping = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return mapping[dayIndex];
}

function loadSchedule() {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SCHEDULE;
    return DAYS.map((day) => ({
      day,
      items: Array.isArray(parsed.find((entry) => entry.day === day)?.items)
        ? parsed.find((entry) => entry.day === day).items
        : DEFAULT_SCHEDULE.find((entry) => entry.day === day)?.items ?? [],
    }));
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

function saveSchedule(schedule) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  } catch {}
}

export default function StudySchedule() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [selectedDay, setSelectedDay] = useState(getTodayLabel());
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    const loaded = loadSchedule();
    setSchedule(loaded);
    setSelectedDay(getTodayLabel());
  }, []);

  useEffect(() => {
    const current = schedule.find((entry) => entry.day === selectedDay);
    setEditorValue(current?.items.join('\n') ?? '');
  }, [schedule, selectedDay]);

  const sessions = useMemo(() => getSubmittedCbtSessions(), []);
  const completedThisWeek = sessions.filter((session) => {
    const submittedDate = new Date(session.submittedAt);
    const now = new Date();
    const diff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const handleSave = () => {
    const nextSchedule = schedule.map((entry) => {
      if (entry.day !== selectedDay) return entry;
      return {
        ...entry,
        items: editorValue.split('\n').map((item) => item.trim()).filter(Boolean),
      };
    });
    setSchedule(nextSchedule);
    saveSchedule(nextSchedule);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold">Jadwal Belajar</h3>
          <p className="text-xs text-muted-foreground">{completedThisWeek} sesi selesai minggu ini</p>
        </div>
      </div>

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
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
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
