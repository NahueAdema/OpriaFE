import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import { BusinessSearch } from '@/components/public/business-search';

/** Public booking funnel: opt into instant-navigation validation explicitly. */
export const instant = true;

export default function PublicSearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-200">
              O
            </span>
            <span className="text-lg font-semibold text-slate-900">Opria</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Soy un negocio
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <div className="space-y-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <CalendarCheck className="h-3.5 w-3.5" />
              Reservá online, sin llamados
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Encontrá tu negocio y reservá
            </h1>
            <p className="mx-auto max-w-md text-sm text-slate-500">
              Buscá por nombre o por el link que te compartieron. Elegí día y
              horario, y el negocio confirma tu turno.
            </p>
          </div>

          <BusinessSearch />

          <p className="mt-10 text-center text-xs text-slate-400">
            ¿Querés recibir turnos con Opria?{' '}
            <Link
              href="/registro"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Creá tu cuenta
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
