import React, { useRef } from 'react';
import { UploadCloud, FileText, Download } from 'lucide-react';
import { downloadTemplate } from '@/lib/parseCsv';

export default function CsvUpload({ onFile, disabled }) {
  const inputRef = useRef(null);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          disabled ? 'border-border opacity-60' : 'cursor-pointer border-primary/30 hover:border-primary hover:bg-accent'
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="mt-3 text-sm font-semibold">Klik untuk unggah file CSV</p>
        <p className="mt-1 text-xs text-muted-foreground">Format .csv, maksimal sesuai kebutuhan. 13 kolom wajib.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Belum punya format?
        </p>
        <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> Unduh Template
        </button>
      </div>
    </div>
  );
}