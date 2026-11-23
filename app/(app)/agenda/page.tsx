'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  Phone,
  Scissors,
  UserRound,
} from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import {
  APPOINTMENT_ACTIONS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  groupByDateKey,
} from '@/lib/appointments';
import type { Appointment, AppointmentStatus } from '@/lib/types';
import {
  addMonthsToMonthKey,
  formatDateKeyLong,
  formatMoney,
  formatMonthLabel,
  formatTimeInZone,
  monthGridDays,
  monthKeyOf,
  startOfMonthIso,
  startOfNextMonthIso,
  todayKeyInZone,
} from '@/lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Modal,
  Spinner,
  Textarea,
  WakingUpHint,
} from '@/components/ui';
import { cn } from '@/lib/cn';

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function AgendaPage() {
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState('');
  const [todayKey, setTodayKey] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [reason, setReason] = useState('');

  const businessQuery = useQuery({
    queryKey: ['business'],
    queryFn: () => api.business.get(),
  });
  const timezone =
    businessQuery.data?.timezone ?? 'America/Argentina/Buenos_Aires';

  useEffect(() => {
    if (!businessQuery.data || monthKey) {
      return;
    }

    const today = todayKeyInZone(businessQuery.data.timezone);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayKey(today);
    setMonthKey(monthKeyOf(today));
    setSelectedDate(today);
  }, [businessQuery.data, monthKey]);

  const monthCells = useMemo(
    () => (monthKey ? monthGridDays(monthKey) : []),
    [monthKey],
  );

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'month', monthKey],
    queryFn: () =>
      api.appointments.list({
        from: startOfMonthIso(monthKey, timezone),
        to: startOfNextMonthIso(monthKey, timezone),
        limit: 500,
      }),
    enabled: Boolean(monthKey && businessQuery.data),
  });

  const appointments = useMemo(
    () => appointmentsQuery.data?.items ?? [],
    [appointmentsQuery.data],
  );
  const byDate = useMemo(
    () => groupByDateKey(appointments, timezone),
    [appointments, timezone],
  );

  const dayAppointments = byDate.get(selectedDate) ?? [];
  const monthPending = appointments.filter(
    (appointment) => appointment.status === 'pending',
  ).length;

  const mutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: Exclude<AppointmentStatus, 'pending'>;
    }) =>
      api.appointments.updateStatus(input.id, {
        status: input.status,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (updated) => {
      setSelected(updated);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['public-calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['public-availability'] });
    },
  });

  function goToToday() {
    if (!todayKey) {
      return;
    }

    setMonthKey(monthKeyOf(todayKey));
    setSelectedDate(todayKey);
  }

  function shiftMonth(delta: number) {
    if (!monthKey) {
      return;
    }

    const next = addMonthsToMonthKey(monthKey, delta);

    setMonthKey(next);
    setSelectedDate(
      selectedDate.startsWith(next) ? selectedDate : `${next}-01`,
    );
  }

  return (
    <>
      <div className="section-title-row">
        <div>
          <div className="eyebrow">ORGANIZÁ TU TIEMPO</div>
          <h1>Mi agenda</h1>
          <p>Gestioná tus citas y mantené tu día en orden.</p>
        </div>
        <div className="title-action agenda-toolbar">
          <div className="agenda-date-controls">
            <button
              type="button"
              className="button button-secondary"
              onClick={goToToday}
              disabled={!todayKey}
            >
              Hoy
            </button>
            <strong>
              {monthKey ? formatMonthLabel(monthKey) : 'Cargando…'}{' '}
              <span>· {selectedDate}</span>
            </strong>
          </div>
          <div className="agenda-filters">
            {appointmentsQuery.isLoading ? (
              <WakingUpHint className="text-left" />
            ) : null}
            {monthPending > 0 ? (
              <span className="nav-count" style={{ background: 'color-mix(in srgb, var(--warning) 16%, transparent)', color: 'var(--warning)', border: 'none' }}>
                {monthPending} pendiente{monthPending === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {appointmentsQuery.error ? (
        <ErrorBanner
          message={
            appointmentsQuery.error instanceof Error
              ? appointmentsQuery.error.message
              : 'No pudimos cargar la agenda.'
          }
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground transition hover:bg-background hover:text-foreground"
              aria-label="Mes anterior"
              disabled={!monthKey}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">
              {monthKey ? formatMonthLabel(monthKey) : 'Cargando…'}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground transition hover:bg-background hover:text-foreground"
              aria-label="Mes siguiente"
              disabled={!monthKey}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 py-3">
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_HEADERS.map((label) => (
                <span
                  key={label}
                  className="pb-1 text-xs font-medium tracking-wide text-subtle-foreground uppercase"
                >
                  {label}
                </span>
              ))}

              {appointmentsQuery.isLoading
                ? Array.from({ length: 35 }, (_, index) => (
                    <span
                      key={`skeleton-${index}`}
                      className="h-11 animate-pulse rounded-lg bg-accent-soft"
                    />
                  ))
                : monthCells.map((dateKey, index) => {
                    if (!dateKey) {
                      return <span key={`empty-${index}`} />;
                    }

                    const dayItems = byDate.get(dateKey) ?? [];
                    const pending = dayItems.some(
                      (appointment) => appointment.status === 'pending',
                    );
                    const confirmed = dayItems.some(
                      (appointment) => appointment.status === 'confirmed',
                    );
                    const isSelected = dateKey === selectedDate;
                    const isToday = dateKey === todayKey;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => setSelectedDate(dateKey)}
                        className={cn(
                          'flex h-11 flex-col items-center justify-center rounded-lg text-sm transition',
                          isSelected
                            ? 'bg-primary font-semibold text-white shadow-sm'
                            : 'text-foreground hover:bg-accent-soft',
                          !isSelected && isToday
                            ? 'ring-1 ring-accent-soft ring-inset'
                            : '',
                        )}
                      >
                        <span>{Number(dateKey.slice(8, 10))}</span>
                        <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                          {pending ? (
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                isSelected ? 'bg-surface' : 'bg-warning',
                              )}
                            />
                          ) : null}
                          {confirmed ? (
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                isSelected ? 'bg-surface/70' : 'bg-success',
                              )}
                            />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2.5 text-xs text-subtle-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Pendiente
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Confirmado
            </span>
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground capitalize">
                {selectedDate
                  ? formatDateKeyLong(selectedDate)
                  : 'Elegí un día'}
              </h2>
              <p className="text-xs text-subtle-foreground">
                {dayAppointments.length} turno
                {dayAppointments.length === 1 ? '' : 's'} en el día
              </p>
            </div>
            {appointmentsQuery.isFetching ? (
              <Spinner className="h-4 w-4" />
            ) : null}
          </div>

          {dayAppointments.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState
                icon={CalendarDays}
                title="Sin turnos este día"
                description="Cuando alguien reserve, la solicitud va a aparecer acá para que la confirmes o rechaces."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {dayAppointments.map((appointment) => (
                <li key={appointment.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(appointment);
                      setReason('');
                    }}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-background"
                  >
                    <span className="flex w-14 shrink-0 flex-col items-start">
                      <span className="text-sm font-semibold text-foreground">
                        {formatTimeInZone(appointment.startsAt, timezone)}
                      </span>
                      <span className="text-xs text-subtle-foreground">
                        {appointment.durationMinutes} min
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {appointment.customerName}
                        </span>
                        <Badge
                          tone={APPOINTMENT_STATUS_TONES[appointment.status]}
                        >
                          {APPOINTMENT_STATUS_LABELS[appointment.status]}
                        </Badge>
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle-foreground">
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5" />
                          {appointment.serviceName}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserRound className="h-3.5 w-3.5" />
                          {appointment.staffName}
                        </span>
                        <span>$ {formatMoney(appointment.priceCents)}</span>
                      </span>
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-subtle-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AppointmentModal
        appointment={selected}
        timezone={timezone}
        reason={reason}
        onReasonChange={setReason}
        pending={mutation.isPending}
        error={
          mutation.error instanceof ApiError ? mutation.error.message : null
        }
        onClose={() => {
          setSelected(null);
          setReason('');
          mutation.reset();
        }}
        onAction={(status) => {
          if (selected) {
            mutation.mutate({ id: selected.id, status });
          }
        }}
      />
    </>
  );
}

function AppointmentModal({
  appointment,
  timezone,
  reason,
  onReasonChange,
  pending,
  error,
  onClose,
  onAction,
}: {
  appointment: Appointment | null;
  timezone: string;
  reason: string;
  onReasonChange: (value: string) => void;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onAction: (status: Exclude<AppointmentStatus, 'pending'>) => void;
}) {
  if (!appointment) {
    return null;
  }

  const actions = APPOINTMENT_ACTIONS[appointment.status];

  return (
    <Modal
      open
      title={appointment.customerName}
      description={`${APPOINTMENT_STATUS_LABELS[appointment.status]} · ${formatDateKeyLong(
        localDateKey(appointment.startsAt, timezone),
      )}`}
      onClose={onClose}
      footer={
        actions.length > 0 ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cerrar
            </Button>
            {actions.map((action) => (
              <Button
                key={action.status}
                variant={
                  action.status === 'rejected' ||
                  action.status === 'cancelled' ||
                  action.status === 'no_show'
                    ? 'danger'
                    : 'primary'
                }
                disabled={pending}
                onClick={() =>
                  onAction(
                    action.status as Exclude<AppointmentStatus, 'pending'>,
                  )
                }
              >
                {action.label}
              </Button>
            ))}
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        )
      }
    >
      <div className="space-y-4 text-sm">
        <dl className="space-y-2">
          <Row
            icon={Clock3}
            label="Horario"
            value={`${formatTimeInZone(appointment.startsAt, timezone)} – ${formatTimeInZone(appointment.endsAt, timezone)}`}
          />
          <Row
            icon={Scissors}
            label="Servicio"
            value={appointment.serviceName}
          />
          <Row
            icon={UserRound}
            label="Profesional"
            value={appointment.staffName}
          />
          <Row
            icon={Phone}
            label="Teléfono"
            value={
              <a
                href={`tel:${appointment.customerPhone}`}
                className="font-medium text-primary hover:text-primary-hover"
              >
                {appointment.customerPhone}
              </a>
            }
          />
          {appointment.customerEmail ? (
            <Row
              icon={Mail}
              label="Email"
              value={
                <a
                  href={`mailto:${appointment.customerEmail}`}
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  {appointment.customerEmail}
                </a>
              }
            />
          ) : null}
          <Row
            icon={CheckCircle2}
            label="Precio"
            value={`$ ${formatMoney(appointment.priceCents)}`}
          />
        </dl>

        {appointment.depositType !== 'none' ? (
          <div className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-primary-dark">
            Seña:{' '}
            {appointment.depositType === 'fixed'
              ? `$ ${formatMoney(appointment.depositValue)}`
              : `${appointment.depositValue}% ($ ${formatMoney(
                  Math.round(
                    (appointment.priceCents * appointment.depositValue) / 100,
                  ),
                )})`}
          </div>
        ) : null}

        {appointment.notes ? (
          <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Comentarios</p>
            <p className="mt-1 whitespace-pre-line">{appointment.notes}</p>
          </div>
        ) : null}

        {appointment.statusReason ? (
          <div className="rounded-xl bg-error/10 px-3 py-2 text-xs text-error">
            Motivo: {appointment.statusReason}
          </div>
        ) : null}

        {actions.some(
          (action) =>
            action.status === 'rejected' || action.status === 'cancelled',
        ) ? (
          <div className="space-y-1.5">
            <label
              htmlFor="agenda-reason"
              className="block text-xs font-medium text-muted-foreground"
            >
              Motivo (opcional)
            </label>
            <Textarea
              id="agenda-reason"
              rows={2}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Se comparte con el cliente si rechazás o cancelás"
            />
          </div>
        ) : null}

        {error ? <ErrorBanner message={error} /> : null}
      </div>
    </Modal>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-subtle-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="max-w-[65%] text-right font-medium break-words text-foreground">
        {value}
      </dd>
    </div>
  );
}

function localDateKey(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
}
