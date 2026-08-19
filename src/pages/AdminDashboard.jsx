import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  LayoutDashboard,
  Users,
  Brain,
  ClipboardList,
  BarChart3,
  GraduationCap,
  FileQuestion,
  TrendingUp,
  ArrowRight,
  MoreHorizontal,
  Upload,
  Wrench,
} from 'lucide-react';
import adminClient from '@/api/adminClient.js';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/bank-soal', label: 'Bank Soal', icon: Brain },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

const CATEGORY_COLORS = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

function formatJoined(value) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminClient.getDashboard()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = data ? [
    { label: 'Total Student', value: data.totalStudent?.toLocaleString('id-ID') ?? '0', icon: GraduationCap, tone: 'bg-primary/10 text-primary' },
    { label: 'Bank Soal', value: data.bankSoal?.toLocaleString('id-ID') ?? '0', icon: FileQuestion, tone: 'bg-chart-2/10 text-chart-2' },
    { label: 'Latihan Hari Ini', value: data.latihanHariIni?.toLocaleString('id-ID') ?? '0', icon: ClipboardList, tone: 'bg-chart-3/10 text-chart-3' },
    { label: 'Rata-rata Skor', value: String(data.rataRataSkor ?? 0), icon: TrendingUp, tone: 'bg-amber-500/10 text-amber-600' },
  ] : [];

  const students = data?.recentStudents ?? [];
  const categories = data?.categoryDistribution ?? [];
  const maxCount = categories.length ? Math.max(...categories.map((c) => c.count)) : 0;

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Memuat dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Gagal memuat dashboard: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ringkasan platform NursePrep CBT hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await adminClient.fixOptionsJson();
                alert('Opsi soal berhasil diperbaiki!');
              } catch (err) {
                alert('Gagal memperbaiki opsi soal: ' + err.message);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Wrench className="h-4 w-4" />
            Perbaiki Opsi Soal
          </button>
          <button
            onClick={() => navigate('/admin/bank-soal')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md"
          >
            <Brain className="h-4 w-4" />
            Tambah Soal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-heading text-3xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent students */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-heading text-base font-bold">Student Terbaru</h3>
              <button onClick={() => navigate('/admin/users')} className="text-sm font-medium text-primary hover:underline">Kelola semua</button>
            </div>
            {students.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Belum ada student terdaftar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Nama</th>
                      <th className="px-5 py-3 font-medium">Latihan</th>
                      <th className="px-5 py-3 font-medium">Rata-rata</th>
                      <th className="px-5 py-3 font-medium">Bergabung</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s) => (
                      <tr key={s.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                              {(s.name || '?').charAt(0)}
                            </div>
                            <div className="leading-tight">
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{s.tests}</td>
                        <td className="px-5 py-3">
                          <span className={`font-semibold ${s.avg >= 80 ? 'text-emerald-600' : s.avg >= 70 ? 'text-amber-600' : 'text-destructive'}`}>
                            {s.avg}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{formatJoined(s.joined)}</td>
                        <td className="px-5 py-3 text-right">
                          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Side widgets */}
        <div className="space-y-6">
          {/* Category distribution */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-bold">Distribusi Soal</h3>
            {categories.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Belum ada soal.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {categories.map((c, i) => (
                  <div key={c.category}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{c.category}</span>
                      <span className="text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} style={{ width: `${maxCount ? Math.round((c.count / maxCount) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-bold">Manajemen Cepat</h3>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Tambah Soal Baru', icon: FileQuestion, to: '/admin/bank-soal' },
                { label: 'Undang Student', icon: GraduationCap, to: '/admin/users' },
                { label: 'Buat Simulasi', icon: ClipboardList, to: '/admin/bank-soal' },
                { label: 'Unduh Laporan', icon: BarChart3, to: '/admin/laporan' },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="group flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-accent"
                >
                  <span className="flex items-center gap-2.5">
                    <a.icon className="h-4 w-4 text-primary" />
                    {a.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}