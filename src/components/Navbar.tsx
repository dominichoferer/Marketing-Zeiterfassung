'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, List, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { COMPANIES } from '@/lib/config';
import clsx from 'clsx';

interface NavbarProps {
  profile: Profile;
}

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/neu',        label: 'Neuer Eintrag', icon: PlusCircle },
  { href: '/eintraege',  label: 'Alle Einträge', icon: List },
];

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-[240px] bg-slate-900 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Marketing</p>
        <h1 className="text-white font-bold text-lg leading-tight">Zeiterfassung</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Firmen-Legende */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Firmen</p>
        <div className="space-y-1.5">
          {COMPANIES.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs text-slate-400 truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {profile.staff_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{profile.staff_name}</p>
            <p className="text-xs text-slate-500">{profile.staff_code}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full transition-colors"
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
