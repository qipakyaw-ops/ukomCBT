import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  Timer,
  Brain,
  ChartNoAxesColumn,
  BookOpenCheck,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Bank Soal Komprehensif',
    desc: 'Ribuan soal CBT UKOM terstruktur sesuai kurikulum keperawatan dan kompetensi inti perawat Indonesia.',
  },
  {
    icon: Timer,
    title: 'Simulasi Waktu Nyata',
    desc: 'Latihan dengan timer persis seperti ujian resmi untuk melatih manajemen waktu dan ketenangan.',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'Analisis Performa',
    desc: 'Pantau perkembangan tiap topik, identifikasi kelemahan, dan fokus belajar tepat sasaran.',
  },
  {
    icon: BookOpenCheck,
    title: 'Pembahasan Lengkap',
    desc: 'Setiap soal dilengkapi rasionalitas klinis dan referensi untuk pemahaman mendalam.',
  },
  {
    icon: ShieldCheck,
    title: 'Mode Adaptif',
    desc: 'Tingkat kesulitan menyesuaikan kemampuanmu agar selalu belajar di batas optimal.',
  },
  {
    icon: Users,
    title: 'Dikelola Admin',
    desc: 'Tim pengelola memastikan mutu soal selalu terjaga dan diperbarui mengikuti standar terkini.',
  },
];

const steps = [
  { num: '01', title: 'Daftar Akun', desc: 'Buat akun sebagai Student dan langsung mulai berlatih.' },
  { num: '02', title: 'Pilih Latihan', desc: 'Tentukan topik atau ikuti simulasi penuh CBT UKOM.' },
  { num: '03', title: 'Kerjakan & Evaluasi', desc: 'Selesaikan soal, lihat skor, dan pelajari pembahasan.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-heading text-base font-bold tracking-tight">NursePrep</p>
              <p className="-mt-0.5 text-[11px] text-muted-foreground">CBT UKOM</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#fitur" className="transition-colors hover:text-foreground">Fitur</a>
            <a href="#cara-kerja" className="transition-colors hover:text-foreground">Cara Kerja</a>
            <a href="#harga" className="transition-colors hover:text-foreground">Paket</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              Persiapkan Uji Kompetensi Ners
            </span>
            <h1 className="mt-6 text-balance font-heading text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
              Latihan CBT UKOM yang
              <span className="text-primary"> terarah</span> & terukur
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Platform latihan komputer berbasis tes untuk mahasiswa keperawatan dan perawat.
              Bangun kepercayaan diri hadapi ujian kompetensi dengan ribuan soal berkualitas.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-lg sm:w-auto"
              >
                Mulai Berlatih Gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted sm:w-auto"
              >
                Saya sudah punya akun
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 5.000+ soal</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Hasil instan</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Akses 24/7</span>
            </div>
          </div>

          {/* Mock dashboard preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-3">
                {[
                  { label: 'Skor Rata-rata', value: '82', suffix: '/100', tone: 'text-primary' },
                  { label: 'Latihan Selesai', value: '24', suffix: 'sesi', tone: 'text-chart-2' },
                  { label: 'Topik Dikuasai', value: '12', suffix: 'topik', tone: 'text-chart-3' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`mt-1 font-heading text-2xl font-bold ${s.tone}`}>
                      {s.value} <span className="text-sm font-medium text-muted-foreground">{s.suffix}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Fitur Unggulan</p>
          <h2 className="mt-2 text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Semua yang kamu butuhkan untuk lulus
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dirancang khusus untuk kebutuhan calon perawat Indonesia dengan standar uji kompetensi terkini.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Cara Kerja</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Tiga langkah menuju kompetensi
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-12 top-12 hidden h-px w-full bg-gradient-to-r from-primary/40 to-transparent md:block" />
                )}
                <div className="relative rounded-2xl border border-border bg-card p-6">
                  <span className="font-heading text-3xl font-extrabold text-primary/20">{s.num}</span>
                  <h3 className="mt-2 font-heading text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="harga" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center shadow-xl sm:px-12">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Siap menjadi perawat kompeten?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Bergabung dengan ribuan calon perawat yang mempersiapkan UKOM bersama NursePrep.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-bold text-primary shadow-sm transition-all hover:shadow-lg"
            >
              Buat Akun Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-heading font-bold text-foreground">NursePrep CBT</span>
          </div>
          <p>© {new Date().getFullYear()} NursePrep CBT. Dibuat untuk perawat Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}