import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      const roleFromUser = user?.role;
      navigate(roleFromUser === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password kamu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
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
            Selamat datang kembali 👋
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/80">
            Masuk untuk melanjutkan latihan dan melacak progres menuju kompetensi sebagai perawat profesional.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <p className="text-sm text-primary-foreground/90">
              Data kamu aman. Login digunakan hanya untuk sesi latihan.
            </p>
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} NursePrep CBT
        </p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-heading text-lg font-bold">NursePrep CBT</span>
            </Link>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight">Masuk ke akun</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Daftar di sini
            </Link>
          </p>

          {/* Removed role selector: role is derived from authenticated user data */}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium">Password</label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
              Ingat saya di perangkat ini
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-70"
            >
              {loading ? 'Memproses…' : 'Masuk'}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
            {error ? (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            ) : null}
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan masuk, kamu menyetujui ketentuan layanan & kebijakan privasi NursePrep CBT.
          </p>
        </div>
      </div>
    </div>
  );
}