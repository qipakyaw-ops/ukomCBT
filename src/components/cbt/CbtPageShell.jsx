import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { BarChart3, Brain, Book, ClipboardList, LayoutDashboard } from 'lucide-react';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/latihan', label: 'Latihan Soal', icon: Brain },
  { href: '/student/simulasi', label: 'Simulasi Ujian', icon: Book },
  { href: '/student/riwayat', label: 'Riwayat', icon: ClipboardList },
  { href: '/student/performa', label: 'Performa', icon: BarChart3 },
];

export default function CbtPageShell({ title, description, children }) {
  const { user } = useAuth();
  const userName = user?.name ?? 'Mahasiswa';

  return (
    <DashboardLayout role="student" userName={userName} navItems={navItems}>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </DashboardLayout>
  );
}
