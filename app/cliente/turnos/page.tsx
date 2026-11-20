'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  MapPin,
  RotateCcw,
  Scissors,
  Search,
} from 'lucide-react';
import { CustomerHeader } from '@/components/customer/customer-header';
import { ApiError, customerApi } from '@/lib/api';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
} from '@/lib/appointments';
import type { CustomerAppointment } from '@/lib/types';
import {
  dateKeyInZone,
  formatDateKeyLong,
  formatMoney,
  formatTimeInZone,
} from '@/lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Modal,
  Spinner,
  SuccessBanner,
} from '@/components/ui';
import { cn } from '@/lib/cn';

type Groups = {
  upcoming: CustomerAppointment[];
  history: CustomerAppointment[];
};

export default function CustomerAppointmentsPage() {
  const queryClient = useQueryClient();
  const [nowIso, setNowIso] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<CustomerAppointment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Initialised on mount so prerender never calls `new Date()`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowIso(new Date().toISOString());
  }, []);

  const appointmentsQuery = useQuery({
    queryKey: ['customer-appointments'],
    queryFn: () => customerApi.appointments.list(100),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => customerApi.appointments.cancel(id),
    onSuccess: (appointment) => {
      setToCancel(null);
      setFeedback(
        `Cancelaste tu turno de ${appointment.serviceName} en ${appointment.business.name}.`,
      );
      void queryClient.invalidateQueries({
        queryKey: ['customer-appointments'],
      });
    },
  });

  const items = useMemo(
    () => appointmentsQuery.data?.items ?? [],
    [appointmentsQuery.data],
  );

  const groups = useMemo<Groups>(() => {
    if (!nowIso) {
      return { upcoming: [], history: [] };
    }

    const upcoming: CustomerAppointment[] = [];
    const history: CustomerAppointment[] = [];

    for (const appointment of items) {
      const isActive =
        appointment.status === 'pending' || appointment.status === 'confirmed';

      if (isActive && appointment.startsAt >= nowIso) {
        upcoming.push(appointment);
      } else {
        history.push(appointment);
      }
    }

    // The API sorts ascending; the history reads better newest first.
    history.reverse();

    return { upcoming, history };
  }, [items, nowIso]);

  const loading = appointmentsQuery.isLoading || !nowIso;
  const isEmpty = !loading && items.length === 0;

  function closeCancelModal() {
    if (cancelMutation.isPending) {
      return;
    }

    setToCancel(null);
    cancelMutation.reset();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-soft via-background to-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <CustomerHeader />

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Mis turnos
            </h1>
            <p className="text-sm text-subtle-foreground">
              Seguí el estado de tus reservas y cancelá las que no puedas
              asistir.
            </p>
          </div>
          <Link
            href="/cliente"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-background"
          >
            <Search className="h-4 w-4" />
            Buscar negocio
          </Link>
        </div>

        {feedback ? (
          <div className="mt-5">
            <SuccessBanner message={feedback} />
          </div>
        ) : null}

        {appointmentsQuery.error ? (
          <div className="mt-5">
            <ErrorBanner
              message={
                appointmentsQuery.error instanceof ApiError
                  ? appointmentsQuery.error.message
                  : 'No pudimos cargar tus turnos.'
              }
            />
          </div>
        ) : null}

        {loading ? (
          <Card className="mt-6 flex items-center justify-center gap-3 p-10 text-sm text-subtle-foreground">
            <Spinner />
            Cargando tus turnos…
          </Card>
        ) : null}

        {isEmpty ? (
          <div className="mt-6">
            <EmptyState
              icon={CalendarDays}
              title="Todavía no tenés turnos"
              description="Buscá un negocio, elegí día y horario, y tu reserva va a aparecer acá."
              action={
                <Link
                  href="/cliente"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover"
                >
                  <Search className="h-4 w-4" />
                  Buscar un negocio
                </Link>
              }
            />
          </div>
        ) : null}

        {!loading && groups.upcoming.length > 0 ? (
          <section className="mt-8 space-y-3">
            <h2 className="px-1 text-xs font-medium tracking-wide text-subtle-foreground uppercase">
              Próximos
            </h2>
            {groups.upcoming.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={() => {
                  setFeedback(null);
                  cancelMutation.reset();
                  setToCancel(appointment);
                }}
              />
            ))}
          </section>
        ) : null}

        {!loading && groups.history.length > 0 ? (
          <section className="mt-8 space-y-3">
            <h2 className="px-1 text-xs font-medium tracking-wide text-subtle-foreground uppercase">
              Historial
            </h2>
            {groups.history.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                muted
              />
            ))}
          </section>
        ) : null}
      </div>

      <Modal
        open={Boolean(toCancel)}
        title="Cancelar turno"
        description={
          toCancel
            ? `${toCancel.serviceName} · ${toCancel.business.name}`
            : undefined
        }
        onClose={closeCancelModal}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeCancelModal}
              disabled={cancelMutation.isPending}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => {
                if (toCancel) {
                  cancelMutation.mutate(toCancel.id);
                }
              }}
            >
              Sí, cancelar
            </Button>
          </>
        }
      >
        {toCancel ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Vas a cancelar el turno del{' '}
              <span className="font-medium text-foreground">
                {formatDateKeyLong(
                  dateKeyInZone(
                    toCancel.startsAt,
                    toCancel.business.timezone,
                  ),
                )}
              </span>{' '}
              a las{' '}
              <span className="font-medium text-foreground">
                {formatTimeInZone(
                  toCancel.startsAt,
                  toCancel.business.timezone,
                )}
              </span>
              .
            </p>
            <p className="text-xs text-subtle-foreground">
              El horario se libera para otra persona. Esta acción no se puede
              deshacer.
            </p>
            {cancelMutation.error ? (
              <ErrorBanner
                message={
                  cancelMutation.error instanceof ApiError
                    ? cancelMutation.error.message
                    : 'No pudimos cancelar el turno.'
                }
              />
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onCancel,
  muted = false,
}: {
  appointment: CustomerAppointment;
  onCancel?: () => void;
  muted?: boolean;
}) {
  const { business } = appointment;
  const timezone = business.timezone;
  const dateLabel = formatDateKeyLong(dateKeyInZone(appointment.startsAt, timezone));
  const isActive =
    appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <Card className={cn('overflow-hidden', muted && 'bg-surface/70')}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-soft text-primary">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Scissors className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {business.name}
              </p>
              {business.city || business.address ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-subtle-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[business.city, business.address]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
            </div>
            <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status]}>
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </Badge>
          </div>

          <p className="text-sm font-medium text-foreground">
            {appointment.serviceName}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTimeInZone(appointment.startsAt, timezone)} –{' '}
              {formatTimeInZone(appointment.endsAt, timezone)}
            </span>
            <span>{appointment.staffName}</span>
            <span>$ {formatMoney(appointment.priceCents)}</span>
          </div>

          {appointment.notes ? (
            <p className="rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
              {appointment.notes}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {onCancel && appointment.canCancel ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onCancel}
              >
                Cancelar turno
              </Button>
            ) : null}

            {isActive && !appointment.canCancel ? (
              <p className="text-xs text-subtle-foreground">
                {appointment.cancellationHours > 0
                  ? `Para cancelar, avisale al negocio con ${appointment.cancellationHours} h de anticipación.`
                  : 'Ya no se puede cancelar online. Contactá al negocio.'}
              </p>
            ) : null}

            <Link
              href={`/reservar/${business.slug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary-hover"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reservar de nuevo
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
