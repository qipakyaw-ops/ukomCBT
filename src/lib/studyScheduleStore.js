import studyScheduleClient from '@/api/studyScheduleClient.js';

// Per-user study schedule, backed by user_schedules (PostgreSQL).
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const DEFAULT_SCHEDULE = [
  { day: 'Sen', items: ['Medikal Bedah — 60 soal (60 mnt)', 'Bank Soal — 30 soal (30 mnt)'] },
  { day: 'Sel', items: ['Farmakologi — 45 soal (45 mnt)'] },
  { day: 'Rab', items: ['Simulasi CBT — 180 soal (180 mnt)'] },
  { day: 'Kam', items: ['Keperawatan Anak — 60 soal (60 mnt)'] },
  { day: 'Jum', items: ['Maternitas — 30 soal (30 mnt)', 'Pembahasan — 30 soal (30 mnt)'] },
  { day: 'Sab', items: ['Simulasi CBT — 180 soal (180 mnt)'] },
  { day: 'Min', items: ['Review Bookmark'] },
];

let cache = null;

function todayIndex() {
  // 0=Sun..6=Sat -> shift to Mon-start: Sen=0
  return (new Date().getDay() + 6) % 7;
}

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) return DEFAULT_SCHEDULE;
  return DAYS.map((day, idx) => {
    const entry = schedule.find((s) => s && s.day === day);
    return {
      day,
      items: Array.isArray(entry?.items) ? entry.items.filter((i) => typeof i === 'string' && i.trim()) : [],
    };
  });
}

// Compute per-category average score from submitted sessions.
function categoryAverages(sessions, questionById) {
  const acc = {};
  sessions.forEach((session) => {
    const answers = session.answers ?? {};
    (session.questionIds || []).forEach((questionId) => {
      const q = questionById.get(questionId);
      if (!q || !q.kategori) return;
      const cat = acc[q.kategori] || { correct: 0, total: 0, score: 0 };
      cat.total += 1;
      if (answers[questionId] === q.correctAnswer) cat.correct += 1;
      acc[q.kategori] = cat;
    });
  });
  return Object.entries(acc).map(([kategori, c]) => ({
    kategori,
    score: c.total ? Math.round((c.correct / c.total) * 100) : 0,
    count: c.total,
  }));
}

const MAX_WEEKLY_SLOTS = 14;
const MAX_DAILY_ITEMS = 4;
const STUDY_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Vary labels so repeated subjects read as distinct activities, not duplicates.
// All follow the standardized format: "[Kategori] — [N] soal ([N] mnt)" with 1:1 UKOM ratio.
// Regular practice uses only 30 or 60 soal (matches Latihan Soal options).
const SLOT_SIZES = [60, 30];

function studyBlockLabel(cat, nSoal) {
  return `${cat} — ${nSoal} soal (${nSoal} mnt)`;
}

function buildRecommendedSchedule(sessions, questionById, sessionGoal, scoreGoal) {
  const cats = categoryAverages(sessions, questionById);
  const core = ['Keperawatan Medikal Bedah', 'Keperawatan Anak', 'Keperawatan Jiwa', 'Maternitas', 'Keperawatan Gerontik', 'Farmakologi'];
  // Weak categories = lowest average, preferred first.
  const weak = [...cats].sort((a, b) => a.score - b.score).map((c) => c.kategori);

  // Fallback: no history -> balanced core subjects.
  if (cats.length === 0) {
    return DEFAULT_SCHEDULE;
  }

  // sessionGoal is the weekly target: the total generated slots MUST equal it
  // exactly (capped so a large goal never floods the view). No hidden extras.
  const totalSlots = Math.min(Math.max(4, Math.round(sessionGoal)), MAX_WEEKLY_SLOTS);

  const pool = weak.length ? [...weak] : [...core];
  const scheduleByDay = { Sen: [], Sel: [], Rab: [], Kam: [], Jum: [], Sab: [], Min: [] };

  // Slot type sources in priority order: weak categories first, then one
  // Simulasi CBT, then one Review Bookmark — all counted within totalSlots.
  const slotSources = [...pool, 'Simulasi CBT', 'Review Bookmark'];
  const ALL_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const dayOrder = [...ALL_DAYS];
  const repeatCount = {};
  let placed = 0;
  let si = 0;
  while (placed < totalSlots) {
    const day = dayOrder[si % dayOrder.length];
    if (scheduleByDay[day].length >= MAX_DAILY_ITEMS) { si += 1; continue; }
    const source = slotSources[si % slotSources.length];

    if (source === 'Simulasi CBT') {
      // Simulasi is always a full UKOM simulation: exactly 180 soal (180 mnt).
      scheduleByDay[day].push(studyBlockLabel('Simulasi CBT', 180));
    } else if (source === 'Review Bookmark') {
      scheduleByDay[day].push('Review Bookmark');
    } else {
      // Regular practice: 1:1 ratio, 30/60 soal. First slot 60, repeats cycle sizes.
      const alreadyHas = scheduleByDay[day].some((it) => it.startsWith(source));
      if (!alreadyHas) {
        scheduleByDay[day].push(studyBlockLabel(source, 60));
      } else {
        const key = `${day}:${source}`;
        const n = repeatCount[key] ?? 0;
        repeatCount[key] = n + 1;
        scheduleByDay[day].push(studyBlockLabel(source, SLOT_SIZES[(1 + n) % SLOT_SIZES.length]));
      }
    }
    placed += 1;
    si += 1;
  }

  return DAYS.map((day) => ({ day, items: scheduleByDay[day] }));
}

// AI insight note: explains why certain categories are prioritized, based on
// per-category performance. Weak = below scoreGoal or bottom 2; strong = top.
export function buildInsightNote(sessions, questionById, scoreGoal) {
  const cats = categoryAverages(sessions, questionById);
  if (cats.length === 0) {
    return 'Belum ada riwayat pengerjaan CBT. AI merekomendasikan jadwal latihan seimbang untuk semua materi UKOM.';
  }
  const sorted = [...cats].sort((a, b) => a.score - b.score);
  const target = scoreGoal || 85;
  const weak = sorted.filter((c) => c.score < target);
  const weakList = weak.length >= 2 ? weak.slice(0, 2) : sorted.slice(0, 2);

  const weakText = weakList.map((c) => `${c.kategori} (rata-rata ${c.score}%)`).join(' dan ');
  const strong = [...cats].sort((a, b) => b.score - a.score).slice(0, 1)[0];

  let note = `Rekomendasi AI: Fokus minggu ini dialokasikan lebih banyak ke ${weakText} yang perlu ditingkatkan.`;
  if (strong && !weakList.some((w) => w.kategori === strong.kategori)) {
    note += ` Pertahankan ${strong.kategori} (rata-rata ${strong.score}%) sebagai kekuatanmu.`;
  }
  return note;
}

// READ: cache synchronously, else load from backend.
export function getSchedule() {
  return cache ?? DEFAULT_SCHEDULE;
}

export async function loadSchedule(userId) {
  if (!userId) return DEFAULT_SCHEDULE;
  try {
    const record = await studyScheduleClient.getSchedule();
    cache = normalizeSchedule(record?.schedule);
  } catch (error) {
    console.error('[StudySchedule] Failed to load schedule:', error);
    cache = DEFAULT_SCHEDULE;
  }
  return cache;
}

// WRITE to backend (per-user).
export async function saveSchedule(userId, schedule) {
  if (!userId) return DEFAULT_SCHEDULE;
  const normalized = normalizeSchedule(schedule);
  const record = await studyScheduleClient.updateSchedule(normalized);
  cache = normalizeSchedule(record?.schedule);
  try {
    window.dispatchEvent(new CustomEvent('studyScheduleUpdated'));
  } catch {}
  return cache;
}

export { DEFAULT_SCHEDULE, normalizeSchedule, buildRecommendedSchedule };