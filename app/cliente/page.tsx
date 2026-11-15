import Link from 'next/link';
import { CalendarCheck, Search, Sparkles, UserRound } from 'lucide-react';
import { BusinessSearch } from '@/components/public/business-search';
import { CustomerHeader } from '@/components/customer/customer-header';

/** Client portal: directory plus the customer account entry points. */
export const instant = true;

const highlights = [
  {
    icon: Search,
    title: 'Buscá y filtrá',
    description:
      'Encontrá negocios por nombre, ciudad o servicio y mirá sus horarios libres.',
  },
  {
    icon: UserRound,
    title: 'Tu cuenta',
    description:
      'Guardá tus datos una vez y reservá más rápido desde cualquier negocio.',
  },
  {
    icon: CalendarCheck,
    title: 'Tus turnos',
    description:
      'Seguí el estado de cada reserva y cancelá los turnos que no puedas asistir.',
  },
];

export default function ClientEntryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-slate-50 to-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
        <CustomerHeader />

        <main className="flex flex-1 flex-col justify-center py-12">
          <div className="space-y-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700 shadow-sm ring-1 ring-violet-100">
              <Sparkles className="h-3.5 w-3.5" />
              Espacio de clientes
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Encontrá tu próximo turno
            </h1>
            <p className="mx-auto max-w-md text-sm text-slate-500">
              Buscá el negocio, elegí día y horario, y reservá en segundos. Con
              tu cuenta seguís todos tus turnos y los cancelás cuando necesites.
            </p>
          </div>

          <BusinessSearch autoFocus />

          <div className="mx-auto mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <item.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-violet-100 bg-white px-4 py-3 text-center text-sm text-slate-600 shadow-sm">
            ¿Todavía no tenés cuenta?{' '}
            <Link
              href="/cliente/registro"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Creala gratis
            </Link>{' '}
            y tené tus turnos a mano.
          </div>
        </main>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">
          <span>Opria · Turnos simples para todos.</span>
          <span>
            ¿Sos un negocio?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Ingresá a tu panel
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
