import React from 'react';
import { History, RotateCcw, CheckCircle2, FileUp } from 'lucide-react';

export default function ImportHistory({ history, onRollback }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
          <History className="h-4 w-4" />
        </div>
        <h3 className="font-heading text-base font-bold">Riwayat Import</h3>
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center">
          <FileUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">Belum ada riwayat import</p>
          <p className="text-xs text-muted-foreground">Riwayat akan muncul setelah kamu mengimpor soal.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                h.rolledBack ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600'
              }`}>
                {h.rolledBack ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{h.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {h.date} • {h.success} diimpor • {h.duplicates} duplikat • {h.invalid} invalid
                </p>
              </div>
              {h.rolledBack ? (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Dibatalkan</span>
              ) : (
                <button
                  onClick={() => onRollback(h.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Rollback
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}