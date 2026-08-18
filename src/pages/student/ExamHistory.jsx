import React, { useEffect, useMemo, useState } from 'react';
import { Award, CalendarDays, CheckCircle2, Clock3, FileQuestion, Search, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';
import { useAuth } from '@/lib/AuthContext';
import questionClient from '@/api/questionClient';

const PASSING_GRADE = 70;

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return '-';
  const seconds = Math.max(0, Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
}

function getDateValue(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ExamHistory() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [questionsById, setQuestionsById] = useState(() => new Map());
  const categories = useMemo(() => ['Semua', ...new Set(sessions.map((session) => session.config?.kategori ?? 'Semua Kategori'))], [sessions]);

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      if (!user?.id) {
        setSessions([]);
        setIsLoadingSessions(false);
        return;
      }
      try {
        const data = await getSubmittedCbtSessions(user.id);
        if (!cancelled) setSessions(data);
      } catch (err) {
        if (!cancelled) setSessionError(err.message);
      } finally {
        if (!cancelled) setIsLoadingSessions(false);
      }
    };
    loadSessions();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    questionClient.getQuestions({ limit: 1000 })
      .then((res) => setQuestionsById(new Map(res.questions.map((q) => [q.id, q]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const refreshSessions = async () => {
      if (!user?.id) return;
      try {
        const data = await getSubmittedCbtSessions(user.id);
        setSessions(data);
      } catch (err) {
        console.error('[ExamHistory] Failed to refresh:', err);
      }
    };
    window.addEventListener('cbtSessionUpdated', refreshSessions);
    window.addEventListener('cbtSessionRemoved', refreshSessions);
    window.addEventListener('cbtSessionsRefreshed', refreshSessions);
    return () => {
      window.removeEventListener('cbtSessionUpdated', refreshSessions);
      window.removeEventListener('cbtSessionRemoved', refreshSessions);
      window.removeEventListener('cbtSessionsRefreshed', refreshSessions);
    };
  }, [user?.id]);

  const sessionPercentage = (session) => {
    const correctCount = session.questionIds.reduce((count, questionId) => {
      const question = questionsById.get(questionId);
      const answer = session.answers?.[questionId];
      return count + (question && answer === question.correctAnswer ? 1 : 0);
    }, 0);
    const total = session.questionIds.length;
    return total > 0 ? Math.round((correctCount / total) * 100) : 0;
  };

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions
      .filter((session) => {
        const sessionCategory = session.config?.kategori ?? 'Semua Kategori';
        const sessionStatus = sessionPercentage(session) >= PASSING_GRADE ? 'Lulus' : 'Tidak Lulus';
        const sessionDate = getDateValue(session.submittedAt);
        const matchesSearch = !query || [session.id, sessionCategory, session.type].some((value) => value?.toLowerCase().includes(query));
        const matchesCategory = category === 'Semua' || sessionCategory === category;
        const sessionType = session.type ?? 'practice';
        const matchesType = typeFilter === 'Semua' || sessionType === typeFilter;
        const matchesStatus = status === 'Semua' || sessionStatus === status;
        const matchesFrom = !fromDate || sessionDate >= fromDate;
        const matchesTo = !toDate || sessionDate <= toDate;
        return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesFrom && matchesTo;
      })
      .sort((a, b) => {
        const first = new Date(a.submittedAt ?? a.createdAt).getTime();
        const second = new Date(b.submittedAt ?? b.createdAt).getTime();
        return sortOrder === 'newest' ? second - first : first - second;
      });
  }, [category, fromDate, search, sessions, sortOrder, status, toDate, typeFilter]);

  const resetFilters = () => {
    setSearch('');
    setCategory('Semua');
    setStatus('Semua');
    setTypeFilter('Semua');
    setFromDate('');
    setToDate('');
    setSortOrder('newest');
  };

  const hasFilters = search || category !== 'Semua' || status !== 'Semua' || typeFilter !== 'Semua' || fromDate || toDate || sortOrder !== 'newest';
  const selectClass = 'rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';
  const inputClass = 'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20';

  if (sessionError) {
    return (
      <CbtPageShell title="Riwayat CBT" description="Gagal memuat riwayat sesi.">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Gagal memuat riwayat: {sessionError}
        </div>
      </CbtPageShell>
    );
  }

  if (isLoadingSessions) {
    return (
      <CbtPageShell title="Riwayat CBT" description="Memuat riwayat sesi...">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Memuat riwayat...
        </div>
      </CbtPageShell>
    );
  }

  return (
    <CbtPageShell title="Riwayat CBT" description="Daftar sesi CBT yang sudah disubmit.">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kategori atau session..." className={`${inputClass} pl-10`} />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass} aria-label="Filter kategori">
            {categories.map((item, i) => <option key={`cat-${i}`} value={item}>{item === 'Semua' ? 'Semua Kategori' : item}</option>)}
          </select>
          <div className="flex flex-wrap items-center gap-1.5">
            {['Semua', 'practice', 'exam'].map((t) => (
              <button key={t} type="button" onClick={() => setTypeFilter(t)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                {t === 'Semua' ? 'Semua' : t === 'practice' ? 'Latihan' : 'Ujian'}
              </button>
            ))}
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass} aria-label="Filter status">
            <option value="Semua">Semua Status</option>
            <option value="Lulus">Lulus</option>
            <option value="Tidak Lulus">Tidak Lulus</option>
          </select>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className={selectClass} aria-label="Urutkan riwayat">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" /> Dari<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={inputClass} aria-label="Tanggal mulai" /></label>
          <label className="flex flex-1 items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" /> Sampai<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className={inputClass} aria-label="Tanggal akhir" /></label>
          {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"><XCircle className="h-4 w-4" /> Reset</button>}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Menampilkan <span className="font-semibold text-foreground">{filteredSessions.length}</span> dari {sessions.length} sesi</p>
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Award className="h-3.5 w-3.5" /> Passing grade {PASSING_GRADE}</p>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h2 className="mt-3 font-heading text-lg font-bold">Belum ada riwayat yang sesuai</h2>
          <p className="mt-1 text-sm text-muted-foreground">Selesaikan dan submit sesi CBT untuk menambah riwayat.</p>
          {hasFilters && <button type="button" onClick={resetFilters} className="mt-4 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Reset Filter</button>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {(() => {
            let practiceNum = 0;
            let examNum = 0;
            return filteredSessions.map((session) => {
              const sessionType = session.type ?? 'practice';
              const sessionTypeLabel = sessionType === 'exam' ? 'Ujian' : 'Latihan';
              const sessionNumber = sessionType === 'exam' ? ++examNum : ++practiceNum;
              const correctCount = session.questionIds.reduce((count, questionId) => {
                const question = questionsById.get(questionId);
                const answer = session.answers?.[questionId];
                return count + (question && answer === question.correctAnswer ? 1 : 0);
              }, 0);
              const unansweredCount = session.questionIds.filter((questionId) => !session.answers?.[questionId]).length;
              const incorrectCount = Math.max(0, session.questionIds.length - correctCount - unansweredCount);
              const totalQuestions = session.questionIds.length;
              const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
              const isPassed = percentage >= PASSING_GRADE;
              const sessionCategory = session.config?.kategori ?? 'Semua Kategori';

              return (
                <Link key={session.id} to={`/student/hasil/${session.id}`} className="block rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isPassed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                        {isPassed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-base font-bold">
                          {sessionTypeLabel} CBT Sesi Ke-{sessionNumber}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{sessionCategory}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatDate(session.submittedAt)}</span>
                          <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {formatDuration(session.startTime, session.submittedAt)}</span>
                          <span>{totalQuestions} soal</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-5 border-t border-border pt-3 lg:border-0 lg:pt-0">
                      <div><p className="text-xs text-muted-foreground">Kategori</p><p className="mt-1 text-sm font-semibold">{sessionCategory}</p></div>
                      <div className="text-right"><p className="text-xs text-muted-foreground">Nilai</p><p className={`mt-1 font-heading text-2xl font-extrabold ${isPassed ? 'text-emerald-600' : 'text-destructive'}`}>{percentage}</p></div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPassed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>{isPassed ? 'Lulus' : 'Tidak Lulus'}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                    <div><p className="text-xs">Benar</p><p className="mt-1 font-semibold text-foreground">{correctCount}</p></div>
                    <div><p className="text-xs">Salah</p><p className="mt-1 font-semibold text-foreground">{incorrectCount}</p></div>
                    <div><p className="text-xs">Kosong</p><p className="mt-1 font-semibold text-foreground">{unansweredCount}</p></div>
                    <div><p className="text-xs">Durasi</p><p className="mt-1 font-semibold text-foreground">{formatDuration(session.startTime, session.submittedAt)}</p></div>
                  </div>
                </Link>
              );
            });
          })()}
        </div>
      )}
    </CbtPageShell>
  );
}
