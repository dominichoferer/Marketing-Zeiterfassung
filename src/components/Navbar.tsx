'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, List, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import clsx from 'clsx';

interface NavbarProps {
  profile: Profile;
}

const leftNav  = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eintraege', label: 'Alle Einträge', icon: List },
];

const rightNav = [
  { href: '/neu', label: 'Neuer Eintrag', icon: PlusCircle },
];

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-brand-600 z-50 shadow-md">
      <div className="flex items-center h-full relative px-6">

        {/* Left Navigation */}
        <nav className="flex items-center gap-1">
          {leftNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logo – absolut zentriert */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <Image
            src="/logo.png"
            alt="Heron Marketing"
            width={100}
            height={32}
            className="object-contain"
            priority
          />
        </div>

        {/* Right: Nav + User */}
        <div className="ml-auto flex items-center gap-1">
          {rightNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-white/20 mx-2" />

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-sm font-semibold">
              {profile.staff_name?.[0] ?? '?'}
            </div>
            <span className="text-white/90 text-sm font-medium hidden md:inline">
              {profile.staff_name}
            </span>
            <button
              onClick={handleLogout}
              className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              title="Abmelden"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
