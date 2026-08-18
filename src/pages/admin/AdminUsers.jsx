import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { LayoutDashboard, Users, Brain, Upload, BarChart3 } from 'lucide-react';
import adminClient from '@/api/adminClient.js';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/bank-soal', label: 'Bank Soal', icon: Brain },
  { href: '/admin/import', label: 'Import CSV', icon: Upload },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
];

function formatJoined(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsers() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminClient.getDashboard()
      .then((res) => { if (!cancelled) setStudents(res.recentStudents ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout role="admin" userName="Admin NursePrep" navItems={navItems}>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Pengguna</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daftar student terdaftar.</p>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Memuat...</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Gagal memuat: {error}</div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Belum ada student terdaftar.</div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Latihan</th>
                <th className="px-5 py-3 font-medium">Rata-rata</th>
                <th className="px-5 py-3 font-medium">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.tests}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${s.avg >= 80 ? 'text-emerald-600' : s.avg >= 70 ? 'text-amber-600' : 'text-destructive'}`}>{s.avg}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatJoined(s.joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}