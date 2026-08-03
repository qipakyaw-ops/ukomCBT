import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CsvUpload from '@/components/admin/CsvUpload';
import CsvPreview from '@/components/admin/CsvPreview';
import ImportHistory from '@/components/admin/ImportHistory';
import { csvToRows } from '@/lib/parseCsv';
import { rowToQuestion, validateQuestion } from '@/lib/validateQuestions';
import { questionStore } from '@/lib/questionStore';
import { useHistory } from '@/hooks/useQuestionStore';
import {
  LayoutDashboard, Users, Brain, BarChart3, Upload, CheckCircle2, Loader2, ArrowLeft,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/bank-soal', label: 'Bank Soal', icon: Brain },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

export default function ImportCsv() {
  const history = useHistory();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(null);

  const handleFile = (file) => {
    setFileName(file.name);
    setDone(null);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, error } = csvToRows(String(reader.result));
      if (error) { setPreview({ error, items: [] }); return; }
      const existingSet = new Set(questionStore.getQuestions().map((q) => q.pertanyaan.toLowerCase()));
      const seenSet = new Set();
      const items = rows.map((row, idx) => {
        const q = rowToQuestion(row);
        const { errors, duplicate } = validateQuestion(q, existingSet, seenSet);
        const key = q.pertanyaan.toLowerCase();
        if (q.pertanyaan && !errors.length && !duplicate) seenSet.add(key);
        const status = errors.length ? 'invalid' : duplicate ? 'duplicate' : 'valid';
        return { idx, q, errors, duplicate, status };
      });
      setPreview({ items });
    };
    reader.readAsText(file);
  };

  const validItems = preview?.items?.filter((i) => i.status === 'valid') ?? [];
  const dupCount = preview?.items?.filter((i) => i.status === 'duplicate').length ?? 0;
  const invalidCount = preview?.items?.filter((i) => i.status === 'invalid').length ?? 0;

  const handleImport = () => {
    if (!validItems.length) return;
    setImporting(true);
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + 8 + Math.random() * 14);
      setProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(timer);
        const added = questionStore.addQuestions(validItems.map((i) => i.q));
        const entry = {
          id: `h${Date.now()}`,
          fileName,
          date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
          total: preview.items.length,
          success: added.length,
          duplicates: dupCount,
          invalid: invalidCount,
          questionIds: added.map((q) => q.id),
        };
        questionStore.addHistory(entry);
        setDone(entry);
        setImporting(false);
        setPreview(null);
        setFileName('');
      }
    }, 130);
  };

  const reset = () => { setPreview(null); setFileName(''); setDone(null); };

  return (
    <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Import CSV</h1>
        <p className="mt-1 text-sm text-muted-foreground">Unggah soal secara massal dengan validasi otomatis.</p>
      </div>

      {done ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-3 font-heading text-lg font-bold">Import berhasil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done.success} soal ditambahkan dari <span className="font-medium">{done.fileName}</span>.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={reset} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:shadow-md">
              Import Lagi
            </button>
          </div>
        </div>
      ) : (
        <>
          {!preview && <CsvUpload onFile={handleFile} disabled={importing} />}

          {importing && (
            <div className="mt-5 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Mengimpor {validItems.length} soal…
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 text-right text-xs text-muted-foreground">{progress}%</p>
            </div>
          )}

          {preview && !importing && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Ganti file
                </button>
                <button
                  onClick={handleImport}
                  disabled={!validItems.length}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> Import {validItems.length} Soal
                </button>
              </div>
              <CsvPreview preview={preview} />
            </div>
          )}
        </>
      )}

      <div className="mt-6">
        <ImportHistory history={history} onRollback={(id) => questionStore.rollback(id)} />
      </div>
    </DashboardLayout>
  );
}