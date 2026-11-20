'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Inbox,
  Scissors,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Card, ErrorBanner, PageHeader, Spinner } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

export default function DashboardPage() {
  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services.list(),
  });
  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff.list(),
  });
  const pendingQuery = useQuery({
    queryKey: ['appointments', 'pending-count'],
    queryFn: () => api.appointments.list({ status: 'pending', limit: 1 }),
  });

  const isLoading =
    businessQuery.isLoading || servicesQuery.isLoading || staffQuery.isLoading;
  const error = businessQuery.error ?? servicesQuery.error ?? staffQuery.error;

  const business = businessQuery.data;
  const services = servicesQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const pendingTotal = pendingQuery.data?.total ?? 0;

  const activeServices = services.filter((service) => service.active);
  const activeStaff = staff.filter((member) => member.active);
  const assignedStaff = activeStaff.filter(
    (member) => member.services.length > 0,
  );
  const averageDuration = activeServices.length
    ? Math.round(
        activeServices.reduce(
          (total, service) => total + service.durationMinutes,
          0,
        ) / activeServices.length,
      )
    : 0;
  const averagePrice = activeServices.length
    ? Math.round(
        activeServices.reduce(
          (total, service) => total + service.priceCents,
          0,
        ) / activeServices.length,
      )
    : 0;

  const steps = [
    {
      label: 'Completá el perfil del negocio',
      description: 'Nombre, timezone y políticas de reserva.',
      done: Boolean(business),
      href: '/business',
    },
    {
      label: 'Creá tu primer servicio',
      description: 'Duración, precio, buffer y seña.',
      done: activeServices.length > 0,
      href: '/services',
    },
    {
      label: 'Sumá a tu equipo',
      description: 'Profesionales que reciben turnos.',
      done: activeStaff.length > 0,
      href: '/staff',
    },
    {
      label: 'Asigná servicios al equipo',
      description: 'Cada persona atiende los servicios que sabe hacer.',
      done: assignedStaff.length > 0,
      href: '/staff',
    },
  ];

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center gap-3 p-10 text-sm text-subtle-foreground">
        <Spinner />
        Cargando resumen…
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={`Hola${business ? `, ${business.name}` : ''}`}
        description="Este es el estado de la configuración de tu negocio."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/agenda"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover"
            >
              <CalendarDays className="h-4 w-4" />
              Abrir agenda
            </Link>
            <Link
              href="/availability"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-background"
            >
              <CalendarClock className="h-4 w-4" />
              Disponibilidad
            </Link>
            {business ? (
              <Link
                href={`/reservar/${business.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-background"
              >
                <Scissors className="h-4 w-4" />
                Página pública
              </Link>
            ) : null}
          </div>
        }
      />

      {pendingTotal > 0 ? (
        <Link
          href="/agenda"
          className="flex items-center gap-3 rounded-2xl border border-warning bg-warning/10 px-5 py-4 transition hover:border-warning hover:bg-warning/70"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              {pendingTotal === 1
                ? '1 solicitud pendiente'
                : `${pendingTotal} solicitudes pendientes`}
            </span>
            <span className="block text-xs text-muted-foreground">
              Confirmá o rechazá los turnos para liberar u ocupar la agenda.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : null}

      {error ? (
        <ErrorBanner
          message={
            error instanceof Error
              ? error.message
              : 'No pudimos cargar el resumen.'
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Scissors}
          label="Servicios activos"
          value={`${activeServices.length}`}
          hint={`${services.length} en total`}
        />
        <StatCard
          icon={Users}
          label="Equipo activo"
          value={`${activeStaff.length}`}
          hint={`${staff.length} en total`}
        />
        <StatCard
          icon={Clock3}
          label="Turno promedio"
          value={`${averageDuration} min`}
          hint="Duración de servicios activos"
        />
        <StatCard
          icon={Building2}
          label="Ticket promedio"
          value={`$ ${formatMoney(averagePrice)}`}
          hint="Precio de servicios activos"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Puesta en marcha
              </h2>
              <p className="text-xs text-subtle-foreground">
                Completá estos pasos para empezar a recibir turnos.
              </p>
            </div>
            <Badge tone="info">
              {steps.filter((step) => step.done).length}/{steps.length}
            </Badge>
          </div>
          <ul className="divide-y divide-border">
            {steps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-background"
                >
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-subtle-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {step.label}
                    </p>
                    <p className="text-xs text-subtle-foreground">{step.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-subtle-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Configuración actual
            </h2>
            <p className="text-xs text-subtle-foreground">
              Datos que usa el motor de disponibilidad.
            </p>
          </div>
          {business ? (
            <dl className="space-y-3 px-5 py-4 text-sm">
              <DetailRow label="Negocio" value={business.name} />
              <DetailRow label="Slug" value={business.slug} />
              <DetailRow label="Timezone" value={business.timezone} />
              <DetailRow
                label="Anticipación mínima"
                value={`${business.bookingMinAdvanceMinutes} min`}
              />
              <DetailRow
                label="Ventana de reserva"
                value={`${business.bookingMaxAdvanceDays} días`}
              />
              <DetailRow
                label="Cancelación"
                value={`${business.cancellationHours} h · ${
                  business.cancellationDepositPolicy === 'retain'
                    ? 'retiene seña'
                    : 'devuelve seña'
                }`}
              />
            </dl>
          ) : (
            <p className="px-5 py-4 text-sm text-subtle-foreground">
              Todavía no pudimos cargar el negocio.
            </p>
          )}
          <div className="border-t border-border px-5 py-3">
            <Link
              href="/business"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
            >
              Editar configuración
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Scissors;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-subtle-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-subtle-foreground">{hint}</p>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-subtle-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium break-words text-foreground">
        {value}
      </dd>
    </div>
  );
}
