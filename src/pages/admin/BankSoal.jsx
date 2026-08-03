import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import QuestionFormModal from '@/components/admin/QuestionFormModal';
import { useQuestions } from '@/hooks/useQuestionStore';
import { questionStore } from '@/lib/questionStore';
import {
  LayoutDashboard, Users, Brain, BarChart3, Plus, Search, Pencil, Trash2, FileQuestion, X, Upload,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/bank-soal', label: 'Bank Soal', icon: Brain },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

const KATEGORI = ['Semua', 'Medikal Bedah', 'Maternitas', 'Keperawatan Anak', 'Keperawatan Jiwa', 'Farmakologi', 'Komunitas', 'Dasar Keperawatan'];
const KESULITAN = ['Semua', 'Mudah', 'Sedang', 'Sulit'];

const kesulitanTone = {
  Mudah: 'bg-emerald-500/10 text-emerald-600',
  Sedang: 'bg-amber-500/10 text-amber-600',
  Sulit: 'bg-destructive/10 text-destructive',
};

export default function BankSoal() {
  const questions = useQuestions();
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterKesulitan, setFilterKesulitan] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return questions.filter((item) => {
      const matchSearch = !q ||
        item.pertanyaan.toLowerCase().includes(q) ||
        item.subkategori.toLowerCase().includes(q) ||
        item.tag.join(' ').toLowerCase().includes(q);
      const matchKategori = filterKategori === 'Semua' || item.kategori === filterKategori;
      const matchKesulitan = filterKesulitan === 'Semua' || item.tingkatKesulitan === filterKesulitan;
      return matchSearch && matchKategori && matchKesulitan;
    });
  }, [questions, search, filterKategori, filterKesulitan]);

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (item) => { setEditing(item); setModalOpen(true); };

  const handleSubmit = (data) => {
    if (editing) {
      questionStore.updateQuestion(editing.id, data);
    } else {
      questionStore.addQuestion(data);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    questionStore.deleteQuestion(id);
    setConfirmDelete(null);
  };

  const selectCls = 'rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Bank Soal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola seluruh soal CBT UKOM. Total {questions.length} soal.</p>
        </div>
        <button onClick={handleAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md">
          <Plus className="h-4 w-4" /> Tambah Soal
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pertanyaan, subkategori, atau tag…"
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className={selectCls}>
          {KATEGORI.map((k) => <option key={k} value={k}>{k === 'Semua' ? 'Semua Kategori' : k}</option>)}
        </select>
        <select value={filterKesulitan} onChange={(e) => setFilterKesulitan(e.target.value)} className={selectCls}>
          {KESULITAN.map((k) => <option key={k} value={k}>{k === 'Semua' ? 'Semua Tingkat' : k}</option>)}
        </select>
        {(search || filterKategori !== 'Semua' || filterKesulitan !== 'Semua') && (
          <button onClick={() => { setSearch(''); setFilterKategori('Semua'); setFilterKesulitan('Semua'); }} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
            <X className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Tidak ada soal ditemukan</p>
          <p className="text-xs text-muted-foreground">Coba ubah kata kunci atau filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.kategori}</span>
                    <span className="text-xs text-muted-foreground">{item.subkategori}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${kesulitanTone[item.tingkatKesulitan]}`}>{item.tingkatKesulitan}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Jawaban: {item.jawabanBenar}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{item.pertanyaan}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tag.map((t) => (
                      <span key={t} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuestionFormModal open={modalOpen} initial={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} />

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-heading text-lg font-bold">Hapus soal ini?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
            <p className="mt-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground line-clamp-2">{confirmDelete.pertanyaan}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">Batal</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-all hover:opacity-90">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}