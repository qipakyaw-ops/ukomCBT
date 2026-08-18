import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Book, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  LayoutDashboard, Brain, ClipboardList, ChartNoAxesColumn,
} from 'lucide-react';
import StatsCards from '@/components/student/StatsCards';
import ProgressChart from '@/components/student/ProgressChart';
import CbtHistory from '@/components/student/CbtHistory';
import BookmarkedQuestions from '@/components/student/BookmarkedQuestions';
import StudyTargets from '@/components/student/StudyTargets';
import StudySchedule from '@/components/student/StudySchedule';
import { useAuth } from '@/lib/AuthContext';
import { getSubmittedCbtSessions } from '@/lib/cbtSessionStore';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/latihan', label: 'Latihan Soal', icon: Brain },
  { href: '/student/simulasi', label: 'Simulasi Ujian', icon: Book },
  { href: '/student/riwayat', label: 'Riwayat', icon: ClipboardList },
  { href: '/student/performa', label: 'Performa', icon: ChartNoAxesColumn },
];

function getLocalGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Pagi';
  if (hour < 16) return 'Siang';
  if (hour < 19) return 'Sore';
  return 'Malam';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const userName = user?.name ?? 'Mahasiswa';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setSessions([]);
        setIsLoadingSessions(false);
        return;
      }
      try {
        const data = await getSubmittedCbtSessions(user.id);
        if (!cancelled) setSessions(data);
      } finally {
        if (!cancelled) setIsLoadingSessions(false);
      }
    };
    load();
    const refresh = async () => {
      if (!user?.id) return;
      try {
        const data = await getSubmittedCbtSessions(user.id);
        setSessions(data);
      } catch (err) {
        console.error('[StudentDashboard] Failed to refresh:', err);
      }
    };
    window.addEventListener('cbtSessionsRefreshed', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('cbtSessionsRefreshed', refresh);
    };
  }, [user?.id]);

  return (
    <DashboardLayout role="student" userName={userName} navItems={navItems}>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Selamat {getLocalGreeting()}, {userName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kamu telah menyelesaikan {sessions.length} sesi CBT. Terus tingkatkan performa kamu.
        </p>
        {isLoadingSessions && <p className="mt-1 text-xs text-muted-foreground">Memuat riwayat...</p>}
      </div>

      <div className="mb-6 relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <TrendingUp className="h-3.5 w-3.5" /> Lanjutkan latihan
            </span>
            <h2 className="mt-3 font-heading text-xl font-bold">Lanjutkan sesi berikutnya</h2>
            <p className="mt-1.5 max-w-md text-sm text-primary-foreground/80">
              Status dan performa diambil langsung dari sesi CBT yang sudah kamu submit.
            </p>
          </div>
          <Link
            to="/student/latihan"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-background px-5 py-2.5 text-sm font-bold text-primary transition-all hover:shadow-lg"
          >
            Lanjutkan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <StatsCards />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressChart />
        </div>
        <div>
          <StudyTargets />
        </div>
      </div>

      <div className="mt-6">
        <StudySchedule />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CbtHistory />
        </div>
        <div>
          <BookmarkedQuestions />
        </div>
      </div>
    </DashboardLayout>
  );
}
