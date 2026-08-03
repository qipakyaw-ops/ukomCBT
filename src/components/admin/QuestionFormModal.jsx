import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const KATEGORI = ['Medikal Bedah', 'Maternitas', 'Keperawatan Anak', 'Keperawatan Jiwa', 'Farmakologi', 'Komunitas', 'Dasar Keperawatan'];
const KESULITAN = ['Mudah', 'Sedang', 'Sulit'];
const OPSI = ['A', 'B', 'C', 'D', 'E'];

const empty = {
  kategori: KATEGORI[0],
  subkategori: '',
  pertanyaan: '',
  type: 'normal',
  vignette: '',
  image: '',
  imageCaption: '',
  pilihan: { A: '', B: '', C: '', D: '', E: '' },
  jawabanBenar: 'A',
  pembahasan: '',
  referensi: '',
  tingkatKesulitan: 'Sedang',
  tag: '',
};

export default function QuestionFormModal({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...initial, tag: (initial.tag || []).join(', ') } : empty);
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setOpsi = (k, v) => setForm((f) => ({ ...f, pilihan: { ...f.pilihan, [k]: v } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedType = form.type || (form.vignette.trim() ? 'vignette' : 'normal');
    const normalizedVignette = form.vignette.trim();
    const normalizedQuestion = form.pertanyaan.trim();
    const options = OPSI.map((optionId) => ({ id: optionId, text: form.pilihan[optionId].trim() }));

    onSubmit({
      ...form,
      category: form.kategori,
      subcategory: form.subkategori,
      difficulty: form.tingkatKesulitan,
      type: normalizedType,
      vignette: normalizedVignette,
      question: normalizedQuestion,
      image: form.image.trim(),
      imageCaption: form.imageCaption.trim(),
      options,
      correctAnswer: form.jawabanBenar,
      discussion: form.pembahasan.trim(),
      reference: form.referensi.trim(),
      questionType: normalizedType,
      tag: form.tag.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const inputCls = 'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold">{initial ? 'Edit Soal' : 'Tambah Soal'}</h2>
            <p className="text-xs text-muted-foreground">Lengkapi semua field di bawah ini</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori</label>
              <select value={form.kategori} onChange={(e) => set('kategori', e.target.value)} className={inputCls}>
                {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Subkategori</label>
              <input value={form.subkategori} onChange={(e) => set('subkategori', e.target.value)} placeholder="cth. Sistem Kardiovaskular" className={inputCls} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tipe Soal</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputCls}>
                <option value="normal">Normal</option>
                <option value="vignette">Vignette</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Gambar (opsional)</label>
              <input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="URL gambar atau path lokal" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Vignette (opsional)</label>
            <textarea value={form.vignette} onChange={(e) => set('vignette', e.target.value)} rows={3} placeholder="Tulis kasus atau skenario jika soal memiliki vignette…" className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Keterangan Gambar (opsional)</label>
            <input value={form.imageCaption} onChange={(e) => set('imageCaption', e.target.value)} placeholder="Keterangan singkat gambar" className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Pertanyaan</label>
            <textarea value={form.pertanyaan} onChange={(e) => set('pertanyaan', e.target.value)} required rows={3} placeholder="Tulis pertanyaan soal…" className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Pilihan Jawaban</label>
            <div className="space-y-2">
              {OPSI.map((o) => (
                <div key={o} className="flex items-center gap-2">
                  <label className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold cursor-pointer transition-all ${
                    form.jawabanBenar === o ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground'
                  }`}>
                    <input type="radio" name="jawabanBenar" checked={form.jawabanBenar === o} onChange={() => set('jawabanBenar', o)} className="sr-only" />
                    {o}
                  </label>
                  <input value={form.pilihan[o]} onChange={(e) => setOpsi(o, e.target.value)} required placeholder={`Pilihan ${o}`} className={inputCls} />
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Klik huruf untuk menandai jawaban benar.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tingkat Kesulitan</label>
              <select value={form.tingkatKesulitan} onChange={(e) => set('tingkatKesulitan', e.target.value)} className={inputCls}>
                {KESULITAN.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tag (pisahkan koma)</label>
              <input value={form.tag} onChange={(e) => set('tag', e.target.value)} placeholder="cth. kardiovaskular, darurat" className={inputCls} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preview CBT</h3>
              <span className="text-xs text-muted-foreground">Tampilan sama seperti saat mengerjakan soal</span>
            </div>
            <div className="mt-3 rounded-2xl border border-border bg-background p-4">
              {(form.type === 'vignette' || form.vignette.trim()) && (
                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Kasus</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{form.vignette.trim() || 'Isi vignette untuk melihat preview'}</p>
                </div>
              )}
              {form.image.trim() && (
                <div className="mt-4">
                  <img src={form.image.trim()} alt={form.imageCaption.trim() || 'Ilustrasi soal'} className="max-h-60 w-full rounded-xl object-contain" />
                  {form.imageCaption.trim() && <p className="mt-2 text-xs text-muted-foreground">{form.imageCaption.trim()}</p>}
                </div>
              )}
              <h4 className="mt-4 text-sm font-semibold leading-relaxed">{form.pertanyaan.trim() || 'Tulis pertanyaan untuk melihat preview'}</h4>
              <div className="mt-4 space-y-2">
                {OPSI.map((optionId) => (
                  <div key={optionId} className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">{optionId}</span>
                    <span className="pt-1 leading-relaxed">{form.pilihan[optionId] || `Pilihan ${optionId}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Pembahasan</label>
            <textarea value={form.pembahasan} onChange={(e) => set('pembahasan', e.target.value)} rows={2} placeholder="Rasionalitas klinis jawaban…" className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Referensi</label>
            <input value={form.referensi} onChange={(e) => set('referensi', e.target.value)} placeholder="cth. Potter & Perry, hlm. 240" className={inputCls} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">
              Batal
            </button>
            <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md">
              {initial ? 'Simpan Perubahan' : 'Tambah Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}