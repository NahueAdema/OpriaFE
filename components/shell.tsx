'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/utils';
import { useAuth } from './auth-provider';

const navigation = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/business', label: 'Negocio', icon: Building2 },
  { href: '/services', label: 'Servicios', icon: Scissors },
  { href: '/staff', label: 'Equipo', icon: Users },
  { href: '/availability', label: 'Disponibilidad', icon: CalendarClock },
  { href: '/cuenta', label: 'Mi cuenta', icon: UserRound },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const pendingQuery = useQuery({
    queryKey: ['appointments', 'pending-count'],
    queryFn: () => api.appointments.list({ status: 'pending', limit: 1 }),
    enabled: Boolean(auth),
    refetchInterval: 60_000,
  });
  const pendingTotal = pendingQuery.data?.total ?? 0;

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  const tenant = auth?.tenant;
  const user = auth?.user;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {open ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-950/40">
              O
            </span>
            <span>
              <span className="block text-base font-semibold text-white">
                Opria
              </span>
              <span className="block text-xs text-slate-400">
                Panel del negocio
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === '/agenda' && pendingTotal > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-semibold text-amber-950">
                    {pendingTotal > 99 ? '99+' : pendingTotal}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-medium">Configuración del negocio</span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            Servicios, equipo, horarios y disponibilidad en un solo lugar.
          </p>
        </div>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
              {initials(user?.name ?? 'Opria')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {tenant?.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              opria.app/{tenant?.slug}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 capitalize">
              {tenant?.role}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
