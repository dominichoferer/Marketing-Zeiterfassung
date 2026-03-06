'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { COMPANIES } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('E-Mail oder Passwort falsch. Bitte nochmal versuchen.');
      setLoading(false);
    } else {
      router.replace('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-slate-800 p-10">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Marketing</p>
          <h1 className="text-white text-2xl font-bold">Zeiterfassung</h1>
        </div>

        <div className="space-y-3">
          <p className="text-slate-400 text-sm font-medium mb-4">Unsere Firmen</p>
          {COMPANIES.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: c.color, color: c.textColor }}
              >
                {c.id}
              </span>
              <span className="text-slate-300 text-sm">{c.name}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Marketing Team
        </p>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Anmelden</h2>
            <p className="text-slate-400 text-sm">Melde dich mit deinem Team-Account an.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="deine@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>

          <p className="mt-6 text-slate-500 text-xs text-center">
            Account noch nicht vorhanden? Bitte beim Admin melden.
          </p>
        </div>
      </div>
    </div>
  );
}
