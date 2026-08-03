import React from 'react';
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
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/bank-soal', label: 'Bank Soal', icon: Brain },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

const stats = [
  { label: 'Total Student', value: '1.248', delta: '+12%', icon: GraduationCap, tone: 'bg-primary/10 text-primary' },
  { label: 'Bank Soal', value: '5.320', delta: '+48', icon: FileQuestion, tone: 'bg-chart-2/10 text-chart-2' },
  { label: 'Latihan Hari Ini', value: '326', delta: '+8%', icon: ClipboardList, tone: 'bg-chart-3/10 text-chart-3' },
  { label: 'Rata-rata Skor', value: '79', delta: '+3%', icon: TrendingUp, tone: 'bg-amber-500/10 text-amber-600' },
];

const students = [
  { name: 'Siti Rahmawati', email: 'siti.r@email.com', tests: 42, avg: 88, joined: '12 Jul' },
  { name: 'Budi Santoso', email: 'budi.s@email.com', tests: 31, avg: 75, joined: '10 Jul' },
  { name: 'Maya Anggraini', email: 'maya.a@email.com', tests: 56, avg: 91, joined: '08 Jul' },
  { name: 'Rizki Hidayat', email: 'rizki.h@email.com', tests: 18, avg: 68, joined: '05 Jul' },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ringkasan platform NursePrep CBT hari ini.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md">
          <Brain className="h-4 w-4" />
          Tambah Soal
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                {s.delta}
              </span>
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
              <button className="text-sm font-medium text-primary hover:underline">Kelola semua</button>
            </div>
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
                    <tr key={s.email} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {s.name.charAt(0)}
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
                      <td className="px-5 py-3 text-muted-foreground">{s.joined}</td>
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
          </div>
        </div>

        {/* Side widgets */}
        <div className="space-y-6">
          {/* Category distribution */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-bold">Distribusi Soal</h3>
            <div className="mt-4 space-y-4">
              {[
                { name: 'Medikal Bedah', count: 1820, pct: 34, color: 'bg-primary' },
                { name: 'Maternitas', count: 1240, pct: 23, color: 'bg-chart-2' },
                { name: 'Keperawatan Anak', count: 980, pct: 18, color: 'bg-chart-3' },
                { name: 'Keperawatan Jiwa', count: 720, pct: 14, color: 'bg-chart-4' },
                { name: 'Lainnya', count: 560, pct: 11, color: 'bg-chart-5' },
              ].map((c) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-bold">Manajemen Cepat</h3>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Tambah Soal Baru', icon: FileQuestion },
                { label: 'Undang Student', icon: GraduationCap },
                { label: 'Buat Simulasi', icon: ClipboardList },
                { label: 'Unduh Laporan', icon: BarChart3 },
              ].map((a) => (
                <button
                  key={a.label}
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