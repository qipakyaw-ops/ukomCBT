import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpenCheck, CheckCircle2, Play, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import { questionStore } from '@/lib/questionStore';
import { createCbtSession, getAvailableQuestions, getActiveCbtSession, removeCbtSession } from '@/lib/cbtSessionStore';

const initialConfig = {
  kategori: 'Semua',
  subkategori: 'Semua',
  jumlahSoal: 5,
  tingkatKesulitan: 'Semua',
  durasi: 30,
};

const durationOptions = [15, 30, 45, 60, 90];
const defaultCountOptions = [5, 10, 20, 30, 50];

function validateConfig(config, availableCount) {
  const errors = {};

  if (!config.kategori) errors.kategori = 'Kategori wajib dipilih.';
  if (!config.subkategori) errors.subkategori = 'Subkategori wajib dipilih.';
  if (!Number.isInteger(Number(config.jumlahSoal)) || Number(config.jumlahSoal) < 1) {
    errors.jumlahSoal = 'Jumlah soal minimal 1.';
  } else if (Number(config.jumlahSoal) > availableCount) {
    errors.jumlahSoal = `Maksimal ${availableCount} soal tersedia untuk filter ini.`;
  }
  if (!config.tingkatKesulitan) errors.tingkatKesulitan = 'Tingkat kesulitan wajib dipilih.';
  if (!durationOptions.includes(Number(config.durasi))) errors.durasi = 'Pilih durasi yang tersedia.';

  return errors;
}

export default function Practice() {
  const navigate = useNavigate();
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const questions = questionStore.getQuestions();
  const [config, setConfig] = useState(initialConfig);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const categories = useMemo(
    () => ['Semua', ...new Set(questions.map((question) => question.kategori))],
    [questions]
  );

  const subcategories = useMemo(() => {
    const filtered = config.kategori === 'Semua'
      ? questions
      : questions.filter((question) => question.kategori === config.kategori);
    return ['Semua', ...new Set(filtered.map((question) => question.subkategori))];
  }, [config.kategori, questions]);

  const availableQuestions = useMemo(
    () => getAvailableQuestions(config),
    [config]
  );

  const countOptions = useMemo(() => {
    const values = new Set(defaultCountOptions);
    if (availableQuestions.length > 0) values.add(availableQuestions.length);
    return [...values].sort((a, b) => a - b);
  }, [availableQuestions.length]);

  useEffect(() => {
    if (!subcategories.includes(config.subkategori)) {
      setConfig((current) => ({ ...current, subkategori: 'Semua' }));
    }
  }, [config.subkategori, subcategories]);

  useEffect(() => {
    const as = getActiveCbtSession();
    if (as && as.status === 'in_progress') {
      setActiveSession(as);
      setShowResumeDialog(true);
    }
  }, []);

  const updateConfig = (key, value) => {
    setConfig((current) => ({ ...current, [key]: key === 'jumlahSoal' || key === 'durasi' ? Number(value) : value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setSubmitError('');
  };

  const handleStart = (event) => {
    event.preventDefault();
    const nextErrors = validateConfig(config, availableQuestions.length);
    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) return;

    setIsStarting(true);
    try {
      const session = createCbtSession(config);
      navigate(`/student/latihan/${session.id}`);
    } catch (error) {
      setSubmitError(error.message);
      setIsStarting(false);
    }
  };

  const handleResume = () => {
    if (!activeSession) return;
    navigate(`/student/latihan/${activeSession.id}`);
  };

  const handleStartNew = () => {
    // Ask for confirmation before deleting
    if (!activeSession) return;
    const confirmed = window.confirm('Session lama akan dihapus. Lanjutkan?');
    if (!confirmed) return;
    removeCbtSession(activeSession.id);
    setShowResumeDialog(false);
  };

  const fieldClass = (field) => `mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
    errors[field] ? 'border-destructive' : 'border-input'
  }`;

  return (
    <CbtPageShell
      title="Latihan CBT"
      description="Atur sesi latihan sesuai target belajar kamu."
    >
      {showResumeDialog && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowResumeDialog(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="resume-dialog-title">
            <div>
              <h2 id="resume-dialog-title" className="font-heading text-lg font-bold">Anda masih memiliki CBT yang belum selesai</h2>
              <p className="mt-2 text-sm text-muted-foreground">Lanjutkan sesi yang sedang berjalan atau mulai sesi baru.</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setShowResumeDialog(false); handleResume(); }} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Lanjutkan</button>
              <button onClick={handleStartNew} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">Mulai Baru</button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleStart} className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-start gap-3 border-b border-border pb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold">Konfigurasi Latihan</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pilih filter soal sebelum memulai sesi.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Kategori
              <select value={config.kategori} onChange={(event) => updateConfig('kategori', event.target.value)} className={fieldClass('kategori')}>
                {categories.map((category) => <option key={category} value={category}>{category === 'Semua' ? 'Semua Kategori' : category}</option>)}
              </select>
              {errors.kategori && <span className="mt-1 block text-xs text-destructive">{errors.kategori}</span>}
            </label>

            <label className="text-sm font-medium">
              Subkategori
              <select value={config.subkategori} onChange={(event) => updateConfig('subkategori', event.target.value)} className={fieldClass('subkategori')}>
                {subcategories.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory === 'Semua' ? 'Semua Subkategori' : subcategory}</option>)}
              </select>
              {errors.subkategori && <span className="mt-1 block text-xs text-destructive">{errors.subkategori}</span>}
            </label>

            <label className="text-sm font-medium">
              Jumlah Soal
              <select value={config.jumlahSoal} onChange={(event) => updateConfig('jumlahSoal', event.target.value)} className={fieldClass('jumlahSoal')}>
                {countOptions.map((count) => <option key={count} value={count}>{count} soal{count > availableQuestions.length ? ' (tidak tersedia)' : ''}</option>)}
              </select>
              {errors.jumlahSoal && <span className="mt-1 block text-xs text-destructive">{errors.jumlahSoal}</span>}
            </label>

            <label className="text-sm font-medium">
              Tingkat Kesulitan
              <select value={config.tingkatKesulitan} onChange={(event) => updateConfig('tingkatKesulitan', event.target.value)} className={fieldClass('tingkatKesulitan')}>
                {['Semua', 'Mudah', 'Sedang', 'Sulit'].map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty === 'Semua' ? 'Semua Tingkat' : difficulty}</option>)}
              </select>
              {errors.tingkatKesulitan && <span className="mt-1 block text-xs text-destructive">{errors.tingkatKesulitan}</span>}
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Durasi
              <select value={config.durasi} onChange={(event) => updateConfig('durasi', event.target.value)} className={fieldClass('durasi')}>
                {durationOptions.map((duration) => <option key={duration} value={duration}>{duration} menit</option>)}
              </select>
              {errors.durasi && <span className="mt-1 block text-xs text-destructive">{errors.durasi}</span>}
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-bold">Ringkasan Sesi</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Soal tersedia</span><span className="font-semibold">{availableQuestions.length}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Soal dipilih</span><span className="font-semibold">{config.jumlahSoal}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Durasi</span><span className="font-semibold">{config.durasi} menit</span></div>
          </div>

          <div className={`mt-5 flex items-start gap-2 rounded-xl p-3 text-xs ${availableQuestions.length >= config.jumlahSoal ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
            {availableQuestions.length >= config.jumlahSoal ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{availableQuestions.length >= config.jumlahSoal ? 'Konfigurasi siap dimulai.' : 'Kurangi jumlah soal atau ubah filter.'}</span>
          </div>

          {submitError && <p className="mt-4 text-sm text-destructive">{submitError}</p>}

          <button type="submit" disabled={isStarting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
            <Play className="h-4 w-4" />
            {isStarting ? 'Menyiapkan sesi...' : 'Mulai CBT'}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Timer dan pengerjaan soal akan ditambahkan pada tahap berikutnya.</p>
        </div>
      </form>
    </CbtPageShell>
  );
}
