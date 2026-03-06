'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, List, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import { COMPANIES } from '@/lib/config';

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
    <aside
      className="fixed top-0 left-0 h-full w-[240px] flex flex-col z-40"
      style={{ backgroundColor: '#1a365d' }}
    >
      {/* Logo / Header */}
      <div
        className="px-6 py-5 border-b flex items-center gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#2c5282' }}
      >
        <div className="relative w-9 h-9 flex-shrink-0">
          <Image
            src="/heron-logo.png"
            alt="Heron Logo"
            fill
            className="object-contain"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Marketing
          </p>
          <h1 className="text-white font-bold text-base leading-tight tracking-wide">
            Zeiterfassung
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? '#2c5282' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Firmen-Legende */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Firmen
        </p>
        <div className="space-y-1.5">
          {COMPANIES.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.color, border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#4da3db' }}
          >
            {profile.staff_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{profile.staff_name}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{profile.staff_code}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm w-full transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
