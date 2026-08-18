import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  LayoutDashboard, Users, Brain, Upload, BarChart3, ClipboardList, Award, TrendingUp, AlertTriangle, Download,
} from 'lucide-react';
import adminClient from '@/api/adminClient.js';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/bank-soal', label: 'Bank Soal', icon: Brain },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

const PERIODS = [
  { key: 'all', label: 'Semua Waktu' },
  { key: '30d', label: '30 Hari Terakhir' },
  { key: 'month', label: 'Bulan Ini' },
];

function MetricCard({ icon: Icon, label, value, sub, tone = 'bg-primary/10 text-primary' }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
      <p className="mt-4 font-heading text-3xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function Laporan() {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminClient.getReports(period)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await adminClient.exportReportsCsv(period);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laporan_performa_student.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Laporan] Export failed:', err);
      alert('Gagal mengekspor CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary;
  const categories = data?.categoryPerformance ?? [];
  const hardest = data?.hardestQuestions ?? [];

  return (
    <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Analisis kelulusan, performa kategori, dan evaluasi soal.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {exporting ? 'Mengekspor...' : 'Ekspor Laporan (CSV)'}
        </button>
      </div>

      {/* Period filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${period === p.key ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Memuat laporan...</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Gagal memuat laporan: {error}</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={ClipboardList} label="Total Sesi Dikerjakan" value={summary?.totalSessions ?? 0} tone="bg-primary/10 text-primary" />
            <MetricCard icon={Award} label="Tingkat Kelulusan Nasional" value={`${summary?.nationalPassRate ?? 0}%`} sub={`Passing grade ${summary?.passingGrade ?? 60}`} tone="bg-emerald-500/10 text-emerald-600" />
            <MetricCard icon={TrendingUp} label="Rata-Rata Skor Nasional" value={summary?.nationalAvg ?? 0} tone="bg-chart-3/10 text-chart-3" />
            <MetricCard icon={AlertTriangle} label="Soal Perlu Evaluasi" value={summary?.soalPerluEvaluasi ?? 0} sub="Akurasi < 30%" tone="bg-amber-500/10 text-amber-600" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Category performance */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading text-base font-bold">Performa per Kategori UKOM</h3>
              {categories.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Belum ada data pengerjaan.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {categories.map((c) => (
                    <div key={c.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{c.category}</span>
                        <span className="text-muted-foreground">{c.attempts} jawaban · {c.accuracy}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${c.accuracy >= 60 ? 'bg-emerald-500' : c.accuracy >= 30 ? 'bg-amber-500' : 'bg-destructive'}`} style={{ width: `${c.accuracy}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hardest questions */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading text-base font-bold">Analisis Soal Tersulit</h3>
              {hardest.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Belum ada data pengerjaan.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Soal</th>
                        <th className="py-2 pr-3 font-medium">Kategori</th>
                        <th className="py-2 pr-3 font-medium text-right">Attempt</th>
                        <th className="py-2 font-medium text-right">Gagal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hardest.map((q) => (
                        <tr key={q.id}>
                          <td className="py-2 pr-3"><p className="line-clamp-2 max-w-[16rem]">{q.question}</p></td>
                          <td className="py-2 pr-3 text-muted-foreground">{q.category}</td>
                          <td className="py-2 pr-3 text-right text-muted-foreground">{q.attempts}</td>
                          <td className="py-2 text-right">
                            <span className="font-semibold text-destructive">{q.failureRate}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}