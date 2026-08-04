import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, Lock, User, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await register(name, email, password, 'student');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Registrasi gagal. Periksa data yang kamu masukkan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-heading text-lg font-bold">NursePrep CBT</span>
            </Link>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight">Buat akun baru</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Masuk di sini
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nama lengkap kamu"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role selection removed: all new users default to Student */}

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-input accent-primary" />
              Saya menyetujui ketentuan layanan & kebijakan privasi NursePrep CBT.
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-70"
            >
              {loading ? 'Membuat akun…' : 'Daftar Sekarang'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
            {error ? (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            ) : null}
          </form>
        </div>
      </div>

      {/* Right brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <Link to="/" className="relative ml-auto flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-lg font-bold">NursePrep</p>
            <p className="-mt-0.5 text-xs text-primary-foreground/70">CBT UKOM</p>
          </div>
        </Link>

        <div className="relative">
          <h2 className="font-heading text-4xl font-extrabold leading-tight">
            Satu langkah lagi menuju kompetensi 🩺
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/80">
            Bergabung dengan ribuan calon perawat yang berlatih CBT UKOM secara terarah dan terukur.
          </p>
          <ul className="mt-8 space-y-3">
            {['Bank soal selalu diperbarui', 'Analisis performa real-time', 'Akses latihan 24/7'].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <GraduationCap className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} NursePrep CBT
        </p>
      </div>
    </div>
  );
}