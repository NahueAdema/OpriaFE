'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck, LogOut } from 'lucide-react';
import { useCustomerAuth } from '@/components/customer-auth-provider';

const linkButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover';
const ghostLinkClass =
  'inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent-soft hover:text-foreground';

/** Session-aware header for the customer pages. */
export function CustomerHeader() {
  const router = useRouter();
  const { customer, status, signOut } = useCustomerAuth();

  async function handleSignOut() {
    await signOut();
    router.push('/cliente');
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white shadow-lg shadow-primary">
          O
        </span>
        <span className="text-lg font-semibold text-foreground">Opria</span>
      </Link>

      <div className="flex items-center gap-1.5">
        {status === 'authenticated' ? (
          <>
            <span className="hidden text-sm text-subtle-foreground sm:inline">
              Hola, <span className="font-medium text-foreground">{customer?.name}</span>
            </span>
            <Link href="/cliente/turnos" className={linkButtonClass}>
              <CalendarCheck className="h-4 w-4" />
              Mis turnos
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className={ghostLinkClass}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Salir</span>
            </button>
          </>
        ) : status === 'anonymous' ? (
          <>
            <Link
              href="/login"
              className="hidden text-sm font-medium text-subtle-foreground transition hover:text-foreground sm:inline"
            >
              Soy un negocio
            </Link>
            <Link href="/cliente/login" className={ghostLinkClass}>
              Ingresar
            </Link>
            <Link href="/cliente/registro" className={linkButtonClass}>
              Crear cuenta
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
