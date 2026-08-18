import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpenCheck, CheckCircle2, Play, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import {
  createCbtSessionWithQuestions,
  getActiveCbtSession,
  removeCbtSession
} from '@/lib/cbtSessionStore';

import questionClient from '@/api/questionClient.js';

const initialConfig = {
  kategori: 'Semua',
  subkategori: 'Semua',
  type: 'Semua',
  jumlahSoal: 30,
  tingkatKesulitan: 'Semua',
  durasi: 30,
};

// Standard practice options: 30 or 60 soal, 30 or 60 minutes (1:1 UKOM ratio).
const durationOptions = [30, 60];
const defaultCountOptions = [30, 60];

const EXAM_CONFIG = {
  kategori: 'Semua',
  subkategori: 'Semua',
  type: 'Semua',
  jumlahSoal: 180,
  tingkatKesulitan: 'Semua',
  durasi: 180,
};

function validateConfig(config, availableCount, isExam = false) {
  const errors = {};

  if (isExam) return errors;
  if (!config.kategori) errors.kategori = 'Kategori wajib dipilih.';
  if (!config.subkategori) errors.subkategori = 'Subkategori wajib dipilih.';
  if (!Number.isInteger(Number(config.jumlahSoal)) || Number(config.jumlahSoal) < 1) {
    errors.jumlahSoal = 'Jumlah soal minimal 1.';
  } else if (Number(config.jumlahSoal) > availableCount) {
    errors.jumlahSoal = `Maksimal ${availableCount} soal tersedia untuk filter ini.`;
  }
  if (!config.tingkatKesulitan) errors.tingkatKesulitan = 'Tingkat kesulitan wajib dipilih.';
  const allDurationOptions = isExam ? [180] : durationOptions;
  if (!allDurationOptions.includes(Number(config.durasi))) errors.durasi = 'Pilih durasi yang tersedia.';

  return errors;
}

export default function Practice({ mode = 'practice' }) {
  const isExamMode = mode === 'exam';
  const navigate = useNavigate();
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [config, setConfig] = useState(isExamMode ? EXAM_CONFIG : initialConfig);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [categories, setCategories] = useState(['Semua']);
  const [subcategories, setSubcategories] = useState(['Semua']);
  const [categorySubcategories, setCategorySubcategories] = useState([]);
  const [difficulties, setDifficulties] = useState(['Semua']);
  const [types, setTypes] = useState(['Semua']);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [apiError, setApiError] = useState('');

  const filteredSubcategories = useMemo(() => {
    if (config.kategori === 'Semua') {
      return subcategories;
    }

    const mappedSubcategories = categorySubcategories
      .filter((item) => item.category === config.kategori)
      .map((item) => item.subcategory)
      .filter(Boolean);

    return ['Semua', ...new Set(mappedSubcategories)];
  }, [config.kategori, categorySubcategories, subcategories]);

  useEffect(() => {
    if (!filteredSubcategories.includes(config.subkategori)) {
      setConfig((current) => ({ ...current, subkategori: 'Semua' }));
    }
  }, [config.subkategori, filteredSubcategories]);

  useEffect(() => {
    const loadFilters = async () => {
      setIsLoadingFilters(true);
      try {
        const filterOptions = await questionClient.getQuestionFilters();
        setCategories(['Semua', ...filterOptions.categories]);
        setSubcategories(['Semua', ...filterOptions.subcategories]);
        setCategorySubcategories(filterOptions.categorySubcategories || []);
        setDifficulties(['Semua', ...filterOptions.difficulties]);
        setTypes(['Semua', ...filterOptions.types]);
      } catch (err) {
        console.error('Failed to load question filters:', err);
        setApiError(err.message || 'Gagal mengambil filter kategori soal dari server.');
        setCategories(['Semua']);
        setSubcategories(['Semua']);
        setDifficulties(['Semua']);
        setTypes(['Semua']);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const fetchAvailableQuestions = async () => {
      setIsLoadingQuestions(true);
      setApiError('');
      try {
        const filters = {};
        if (config.kategori !== 'Semua') filters.category = config.kategori;
        if (config.subkategori !== 'Semua') filters.subcategory = config.subkategori;
        if (config.tingkatKesulitan !== 'Semua') filters.difficulty = config.tingkatKesulitan;
        if (config.type !== 'Semua') filters.type = config.type;

        const result = await questionClient.getQuestions({ ...filters, limit: 1000 });
        setAvailableQuestions(result.questions);
      } catch (err) {
        console.error('Failed to load available questions:', err);
        setApiError(err.message || 'Gagal mengambil daftar soal dari server.');
        setAvailableQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchAvailableQuestions();
  }, [config.kategori, config.subkategori, config.tingkatKesulitan, config.type]);

  const countOptions = useMemo(() => {
    // Standard targets are 30 and 60 soal; drop any option that exceeds the
    // number of questions actually available for the current filter.
    return defaultCountOptions.filter((count) => count <= availableQuestions.length);
  }, [availableQuestions.length]);

  // Show a clear notice when fewer questions than the 30-soal standard exist.
  const insufficientQuestions = availableQuestions.length > 0 && availableQuestions.length < 30;

  const { user } = useAuth(); // ponytail: tambah auth

  // ...

  useEffect(() => {
    if (!user?.id) return;
    const as = getActiveCbtSession(user.id, mode);
    if (as && as.status === 'in_progress' && as.type === mode) {
      setActiveSession(as);
      setShowResumeDialog(true);
    }
  }, [user?.id, mode]);

  const updateConfig = (key, value) => {
    setConfig((current) => ({ ...current, [key]: key === 'jumlahSoal' || key === 'durasi' ? Number(value) : value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setSubmitError('');
  };

  const handleStart = async (event) => {
    event.preventDefault();
    const nextErrors = validateConfig(config, availableQuestions.length, isExamMode);
    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0 || !user?.id) return; // ponytail: cek user.id

    // ponytail: exam mode requires at least 180 questions available
    if (isExamMode && availableQuestions.length < EXAM_CONFIG.jumlahSoal) {
      setSubmitError(`Ujian butuh minimal ${EXAM_CONFIG.jumlahSoal} soal, tersedia ${availableQuestions.length}.`);
      setIsStarting(false);
      return;
    }

    setIsStarting(true);
    try {
      const session = await createCbtSessionWithQuestions(user.id, config, availableQuestions, mode); // ponytail: user.id
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
    if (!activeSession || !user?.id) return;
    const confirmed = window.confirm('Session lama akan dihapus. Lanjutkan?');
    if (!confirmed) return;
    removeCbtSession(activeSession.id, user.id); // ponytail: user.id
    setShowResumeDialog(false);
  };

  const fieldClass = (field) => `mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
    errors[field] ? 'border-destructive' : 'border-input'
  }`;

  return (
    <CbtPageShell
      title={isExamMode ? 'Simulasi Ujian CBT' : 'Latihan CBT'}
      description={isExamMode ? 'Ujian simulasi: 180 soal, 180 menit.' : 'Atur sesi latihan sesuai target belajar kamu.'}
    >
      {apiError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Gagal memuat data dari server:</span> {apiError}
          </div>
        </div>
      )}
      {showResumeDialog && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowResumeDialog(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="resume-dialog-title">
            <div>
              <h2 id="resume-dialog-title" className="font-heading text-lg font-bold">{isExamMode ? 'Ujian belum selesai' : 'Anda masih memiliki CBT yang belum selesai'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{isExamMode ? 'Lanjutkan ujian yang sedang berjalan atau mulai baru.' : 'Lanjutkan sesi yang sedang berjalan atau mulai sesi baru.'}</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setShowResumeDialog(false); handleResume(); }} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{isExamMode ? 'Lanjutkan Ujian' : 'Lanjutkan'}</button>
              <button onClick={handleStartNew} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">{isExamMode ? 'Mulai Ujian Baru' : 'Mulai Baru'}</button>
            </div>
          </div>
        </div>
      )}
      {isExamMode ? (
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-3">
          <div className="flex items-start gap-3 border-b border-border pb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold">Simulasi Ujian</h2>
              <p className="mt-1 text-sm text-muted-foreground">180 soal acak, durasi 180 menit — sesuai aturan ujian asli.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <p>• Soal: <span className="font-semibold text-foreground">{availableQuestions.length}</span> tersedia</p>
            <p>• Dipilih: <span className="font-semibold text-foreground">{config.jumlahSoal}</span> (acak, tidak duplikat)</p>
            <p>• Durasi: <span className="font-semibold text-foreground">{config.durasi} menit</span></p>
          </div>
          {apiError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{apiError}</span>
            </div>
          )}
          {submitError && <p className="mt-3 text-sm text-destructive">{submitError}</p>}
          <form onSubmit={handleStart} className="mt-5">
            <button type="submit" disabled={isStarting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
              <Play className="h-4 w-4" />
              {isStarting ? 'Menyiapkan sesi...' : 'Mulai Ujian'}
            </button>
          </form>
        </div>
      ) : (
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
                {filteredSubcategories.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory === 'Semua' ? 'Semua Subkategori' : subcategory}</option>)}
              </select>
              {errors.subkategori && <span className="mt-1 block text-xs text-destructive">{errors.subkategori}</span>}
            </label>

            <label className="text-sm font-medium">
              Jumlah Soal
              <select value={config.jumlahSoal} onChange={(event) => updateConfig('jumlahSoal', event.target.value)} className={fieldClass('jumlahSoal')}>
                {countOptions.length > 0 ? countOptions.map((count) => <option key={count} value={count}>{count} soal</option>) : <option value={0}>Tidak tersedia</option>}
              </select>
              {errors.jumlahSoal && <span className="mt-1 block text-xs text-destructive">{errors.jumlahSoal}</span>}
              {insufficientQuestions && (
                <span className="mt-1 block text-xs text-amber-600">
                  Hanya {availableQuestions.length} soal tersedia untuk filter ini. Pilih lebih sedikit soal agar dapat memulai sesi.
                </span>
              )}
            </label>

            <label className="text-sm font-medium">
              Tipe Soal
              <select value={config.type} onChange={(event) => updateConfig('type', event.target.value)} className={fieldClass('type')}>
                {types.map((item) => <option key={item} value={item}>{item === 'Semua' ? 'Semua Tipe' : item}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium">
              Tingkat Kesulitan
              <select value={config.tingkatKesulitan} onChange={(event) => updateConfig('tingkatKesulitan', event.target.value)} className={fieldClass('tingkatKesulitan')}>
                {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty === 'Semua' ? 'Semua Tingkat' : difficulty}</option>)}
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
      )}
    </CbtPageShell>
  );
}
