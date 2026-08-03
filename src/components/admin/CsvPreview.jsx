import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const statusMap = {
  valid: { label: 'Valid', icon: CheckCircle2, tone: 'bg-emerald-500/10 text-emerald-600' },
  duplicate: { label: 'Duplikat', icon: AlertTriangle, tone: 'bg-amber-500/10 text-amber-600' },
  invalid: { label: 'Invalid', icon: XCircle, tone: 'bg-destructive/10 text-destructive' },
};

export default function CsvPreview({ preview }) {
  if (preview?.error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold text-destructive">
          <XCircle className="h-4 w-4" /> Gagal memproses file
        </p>
        <p className="mt-1 text-muted-foreground">{preview.error}</p>
      </div>
    );
  }
  if (!preview) return null;

  const { items } = preview;
  const counts = items.reduce((acc, it) => { acc[it.status] = (acc[it.status] || 0) + 1; return acc; }, {});
  const summary = [
    { key: 'valid', label: 'Valid' },
    { key: 'duplicate', label: 'Duplikat' },
    { key: 'invalid', label: 'Invalid' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-base font-bold">Preview Data</h3>
          <p className="text-xs text-muted-foreground">{items.length} baris terdeteksi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.map((s) => (
            <span key={s.key} className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMap[s.key].tone}`}>
              {counts[s.key] || 0} {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Pertanyaan</th>
              <th className="px-4 py-2.5 font-medium">Kategori</th>
              <th className="px-4 py-2.5 font-medium">Jawaban</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((it) => {
              const s = statusMap[it.status];
              return (
                <tr key={it.idx} className="align-top transition-colors hover:bg-muted/40">
                  <td className="px-4 py-2.5 text-muted-foreground">{it.idx + 1}</td>
                  <td className="px-4 py-2.5"><p className="line-clamp-2 max-w-xs">{it.q.pertanyaan || <span className="text-destructive">(kosong)</span>}</p></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{it.q.kategori || '-'}</td>
                  <td className="px-4 py-2.5 font-semibold">{it.q.jawabanBenar || '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.tone}`}>
                      <s.icon className="h-3 w-3" /> {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {it.errors.length ? it.errors.join('; ') : it.duplicate ? 'Soal sudah ada' : 'Siap diimpor'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}