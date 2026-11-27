'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  Scissors,
  Search,
  Settings2,
  Store,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { api } from '@/lib/api';
import { initials } from '@/lib/utils';
import { useAuth } from './auth-provider';

const navigation = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/agenda', label: 'Mi agenda', icon: CalendarDays },
  { href: '/business', label: 'Negocio', icon: Store },
  { href: '/services', label: 'Servicios', icon: Scissors },
  { href: '/staff', label: 'Equipo', icon: Users },
  { href: '/clientes', label: 'Clientes', icon: UserRound },
  { href: '/availability', label: 'Disponibilidad', icon: CalendarClock },
  { href: '/cuenta', label: 'Mi cuenta', icon: Settings2 },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(current === 'dark');
  }, []);

  function toggleTheme() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('opria.theme', next);
    } catch {
      // ignore
    }
    setDark(next === 'dark');
  }

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

  const activeNav =
    navigation.find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? 'Resumen';

  return (
    <div className="app-shell" data-theme={dark ? 'dark' : 'light'}>
      <button
        type="button"
        aria-label="Cerrar navegación"
        className={`mobile-scrim ${open ? 'visible' : ''}`}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <BrandLogo className="h-full w-full" />
          </div>
          <span>
            Opria<span className="brand-dot">.</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="mobile-close"
          >
            <X size={19} />
          </button>
        </div>
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <button className="workspace-switch" type="button" disabled>
          <div className="workspace-avatar">
            {(tenant?.name ?? 'O').charAt(0).toUpperCase()}
          </div>
          <span className="workspace-copy">
            <strong>{tenant?.name ?? 'Mi negocio'}</strong>
            <small>{tenant?.role ?? 'Panel'}</small>
          </span>
          <ChevronDown size={15} className="muted-icon" />
        </button>
        <div className="nav-heading">MENÚ PRINCIPAL</div>
        <nav aria-label="Navegación principal" className="nav-list">
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`nav-link ${active ? 'nav-active' : ''}`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.href === '/agenda' && pendingTotal > 0 ? (
                  <span className="nav-count">
                    {pendingTotal > 99 ? '99+' : pendingTotal}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
            <strong>¿Necesitás ayuda?</strong>
            <p>Estamos para acompañarte.</p>
            <button>
              Visitar centro de ayuda <ExternalLink size={13} />
            </button>
          </div>
          <button className="user-profile" onClick={handleSignOut}>
            <div className="avatar avatar-owner">
              {initials(user?.name ?? 'Opria')}
            </div>
            <span className="workspace-copy">
              <strong>{user?.name ?? 'Usuario'}</strong>
              <small>{user?.email ?? ''}</small>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <nav aria-label="Acciones rápidas" className="sr-only">
            <a href="#main-content">Saltar al contenido principal</a>
          </nav>
          <button
            className="mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>{tenant?.name ?? 'Mi negocio'}</span>
            <span className="crumb-slash">/</span>
            <strong>{activeNav}</strong>
          </div>
          <div className="top-actions">
            <button
              className="icon-button search-button"
              aria-label="Buscar ⌘ K"
            >
              <Search size={18} />
              <span>Buscar</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button notification-button"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? 'Activar modo claro' : 'Activar modo noche'}
              aria-pressed={dark}
              title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="top-divider" />
            <button
              className="avatar avatar-owner top-avatar"
              aria-label="Perfil"
              onClick={() => router.push('/cuenta')}
            >
              {initials(user?.name ?? 'Opria')}
            </button>
          </div>
        </header>

        <main id="main-content" className="page-content">
          {children}
          <footer className="app-footer">
            <span>© 2024 opria · Hecho para que tu negocio florezca</span>
            <span>
              <a href="#privacidad">Privacidad</a>
              <a href="#ayuda">Ayuda</a>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
