'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Mail,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useCustomerAuth } from '@/components/customer-auth-provider';
import { ApiError, customerApi, publicApi } from '@/lib/api';
import { buildIcs, downloadIcs } from '@/lib/ics';
import {
  publicBookingFormSchema,
  type PublicBookingFormValues,
} from '@/lib/schemas';
import type { CustomerAppointment, PublicAppointment } from '@/lib/types';
import {
  addMonthsToMonthKey,
  dateKeyInZone,
  formatDateKeyLong,
  formatDateKeyShort,
  formatMoney,
  formatMonthLabel,
  formatTimeInZone,
  monthGridDays,
  monthKeyOf,
  todayKeyInZone,
} from '@/lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Input,
  Spinner,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/cn';

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function BookingClient({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const { customer, status: customerStatus } = useCustomerAuth();

  const [serviceId, setServiceId] = useState('');
  const [monthKey, setMonthKey] = useState('');
  const [todayKey, setTodayKey] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotTaken, setSlotTaken] = useState(false);
  const [created, setCreated] = useState<PublicAppointment | null>(null);

  const businessQuery = useQuery({
    queryKey: ['public-business', slug],
    queryFn: () => publicApi.getBusiness(slug),
    retry: false,
  });

  const business = businessQuery.data;
  const timezone = business?.timezone ?? 'America/Argentina/Buenos_Aires';
  const services = useMemo(() => business?.services ?? [], [business]);
  const service = services.find((item) => item.id === serviceId) ?? null;

  useEffect(() => {
    if (!business || monthKey) {
      return;
    }

    const today = todayKeyInZone(business.timezone);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayKey(today);
    setMonthKey(monthKeyOf(today));
  }, [business, monthKey]);

  useEffect(() => {
    if (!business || serviceId || business.services.length === 0) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServiceId(business.services[0].id);
  }, [business, serviceId]);

  const monthCells = useMemo(
    () => (monthKey ? monthGridDays(monthKey) : []),
    [monthKey],
  );
  const lastDayOfMonth = useMemo(
    () =>
      [...monthCells].reverse().find((cell): cell is string => Boolean(cell)),
    [monthCells],
  );

  const calendarQuery = useQuery({
    queryKey: ['public-calendar', slug, serviceId, monthKey],
    queryFn: () =>
      publicApi.getCalendar(slug, {
        serviceId,
        from: `${monthKey}-01`,
        to: lastDayOfMonth ?? `${monthKey}-01`,
      }),
    enabled: Boolean(serviceId && monthKey && lastDayOfMonth),
  });

  const availabilityQuery = useQuery({
    queryKey: ['public-availability', slug, serviceId, selectedDate],
    queryFn: () =>
      publicApi.getAvailability(slug, { serviceId, date: selectedDate }),
    enabled: Boolean(serviceId && selectedDate),
  });

  const calendarByDate = useMemo(() => {
    const map = new Map<
      string,
      { date: string; available: boolean; slots: number }
    >();

    for (const day of calendarQuery.data?.days ?? []) {
      map.set(day.date, day);
    }

    return map;
  }, [calendarQuery.data]);

  const form = useForm<PublicBookingFormValues>({
    resolver: zodResolver(publicBookingFormSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      notes: '',
    },
  });

  // A signed-in customer books with the data stored on the account.
  const prefilled = useRef(false);

  useEffect(() => {
    if (!customer || prefilled.current) {
      return;
    }

    prefilled.current = true;
    form.reset({
      ...contactDefaults(customer),
      notes: form.getValues('notes'),
    });
  }, [customer, form]);

  const mutation = useMutation({
    mutationFn: async (
      values: PublicBookingFormValues,
    ): Promise<PublicAppointment> => {
      if (customer) {
        const appointment = await customerApi.appointments.create({
          businessSlug: slug,
          serviceId,
          startsAt: selectedSlot,
          notes: values.notes || undefined,
        });

        return toPublicAppointment(appointment, customer.name);
      }

      return publicApi.createAppointment(slug, {
        serviceId,
        startsAt: selectedSlot,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        notes: values.notes || undefined,
      });
    },
    onSuccess: (appointment) => {
      setCreated(appointment);
      setSelectedSlot('');
      setSlotTaken(false);
      form.reset(contactDefaults(customer));
      void queryClient.invalidateQueries({
        queryKey: ['customer-appointments'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['public-calendar', slug],
      });
      void queryClient.invalidateQueries({
        queryKey: ['public-availability', slug],
      });
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || error.status !== 409) {
        return;
      }

      // Someone took the slot between loading availability and submitting.
      // Clear the stale selection and recompute what is still bookable.
      setSlotTaken(true);
      setSelectedSlot('');
      void queryClient.invalidateQueries({
        queryKey: ['public-availability', slug, serviceId, selectedDate],
      });
      void queryClient.invalidateQueries({
        queryKey: ['public-calendar', slug, serviceId, monthKey],
      });
    },
  });

  function chooseService(id: string) {
    if (id === serviceId) {
      return;
    }

    setServiceId(id);
    setSelectedDate('');
    setSelectedSlot('');
    setSlotTaken(false);
    mutation.reset();
  }

  function chooseDay(dateKey: string) {
    setSelectedDate(dateKey);
    setSelectedSlot('');
    setSlotTaken(false);
    mutation.reset();
  }

  function selectSlot(startsAt: string) {
    setSelectedSlot(startsAt);
    setSlotTaken(false);
    mutation.reset();
  }

  function startOver() {
    setCreated(null);
    setSelectedSlot('');
    setSlotTaken(false);
    form.reset(contactDefaults(customer));
  }

  if (businessQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-subtle-foreground">
        <Spinner className="mr-3" />
        Cargando el negocio…
      </div>
    );
  }

  if (businessQuery.error || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-foreground">
            No encontramos este negocio
          </h1>
          <p className="mt-1 text-sm text-subtle-foreground">
            Puede que el link esté mal escrito o que el negocio ya no esté
            disponible.
          </p>
          <Link
            href="/reservar"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al buscador
          </Link>
        </Card>
      </div>
    );
  }

  if (created) {
    const calendarHours = business.cancellationHours;
    const hasContact = Boolean(business.contactPhone || business.contactEmail);

    return (
      <div className="min-h-screen bg-gradient-to-b from-success via-background to-white px-4 py-10">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <Link
            href="/reservar"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-subtle-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Buscar otro negocio
          </Link>

          <Card className="overflow-hidden">
            <div className="flex flex-col items-center gap-3 border-b border-border bg-surface px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-foreground">
                  ¡Solicitud enviada!
                </h1>
                <p className="text-sm text-subtle-foreground">
                  Tu turno quedó pendiente de confirmación. El negocio se va a
                  comunicar al teléfono que dejaste.
                </p>
              </div>
              <Badge tone="warning">Pendiente de confirmación</Badge>
            </div>

            <dl className="space-y-3 px-6 py-5 text-sm">
              <SummaryRow label="Negocio" value={created.business.name} />
              <SummaryRow label="Servicio" value={created.serviceName} />
              <SummaryRow
                label="Fecha"
                value={formatDateKeyLong(
                  dateKeyInZone(created.startsAt, created.business.timezone),
                )}
              />
              <SummaryRow
                label="Horario"
                value={`${formatTimeInZone(created.startsAt, created.business.timezone)} – ${formatTimeInZone(created.endsAt, created.business.timezone)}`}
              />
              <SummaryRow label="Profesional" value={created.staffName} />
              <SummaryRow
                label="Precio"
                value={`$ ${formatMoney(created.priceCents)}`}
              />
              <SummaryRow label="Seña" value={depositLabel(created)} />
            </dl>

            <div className="border-t border-border px-6 py-4">
              <p className="text-xs font-medium tracking-wide text-subtle-foreground uppercase">
                Qué sigue
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                <li>El negocio revisa la solicitud y confirma el turno.</li>
                <li>Si necesita algo, te contacta al teléfono que dejaste.</li>
                <li>
                  {calendarHours > 0
                    ? `Si no podés asistir, avisá con al menos ${calendarHours} horas de anticipación.`
                    : 'Si no podés asistir, avisale al negocio lo antes posible.'}
                </li>
              </ol>
            </div>

            {hasContact ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-6 py-3 text-xs text-subtle-foreground">
                {business.contactPhone ? (
                  <a
                    href={`tel:${business.contactPhone}`}
                    className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {business.contactPhone}
                  </a>
                ) : null}
                {business.contactEmail ? (
                  <a
                    href={`mailto:${business.contactEmail}`}
                    className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {business.contactEmail}
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row">
              <Button type="button" onClick={startOver} className="sm:flex-1">
                Hacer otra reserva
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const content = buildIcs({
                    id: created.id,
                    startsAt: created.startsAt,
                    endsAt: created.endsAt,
                    summary: `${created.serviceName} · ${created.business.name}`,
                    description: `Turno con ${created.staffName}. Pendiente de confirmación del negocio.`,
                    location: business.address ?? undefined,
                  });

                  downloadIcs('turno-opria.ics', content);
                }}
                className="sm:flex-1"
              >
                <Download className="h-4 w-4" />
                Agregar al calendario
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border px-6 py-3 text-center">
              <Link
                href={`/reservar/${business.slug}`}
                className="text-xs font-medium text-primary transition hover:text-primary-hover"
              >
                Ver el negocio
              </Link>
              {customer ? (
                <Link
                  href="/cliente/turnos"
                  className="text-xs font-medium text-primary transition hover:text-primary-hover"
                >
                  Ver mis turnos
                </Link>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(service && selectedDate && selectedSlot);

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent-soft via-background to-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface text-primary shadow-sm ring-1 ring-border">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Scissors className="h-6 w-6" />
              )}
            </span>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {business.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle-foreground">
                {business.address ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {business.address}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {business.timezone}
                </span>
                {business.contactPhone ? (
                  <a
                    href={`tel:${business.contactPhone}`}
                    className="flex items-center gap-1 transition hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {business.contactPhone}
                  </a>
                ) : null}
                {business.contactEmail ? (
                  <a
                    href={`mailto:${business.contactEmail}`}
                    className="flex items-center gap-1 transition hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {business.contactEmail}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <Link
            href="/reservar"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-subtle-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Buscar otro negocio
          </Link>
        </header>

        {services.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={CalendarDays}
              title="Este negocio todavía no tiene servicios disponibles"
              description="Volvé a intentarlo más tarde o contactalo directamente."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Card className="overflow-hidden">
                <StepHeader step={1} title="Elegí un servicio" />
                <div className="space-y-2 px-5 py-4">
                  {services.map((item) => {
                    const active = item.id === serviceId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseService(item.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                          active
                            ? 'border-primary bg-accent-soft/70 ring-2 ring-accent-soft'
                            : 'border-border bg-surface hover:border-accent-soft hover:bg-background',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            active
                              ? 'bg-primary text-white'
                              : 'bg-accent-soft text-subtle-foreground',
                          )}
                        >
                          <Scissors className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-subtle-foreground">
                            {item.durationMinutes} min · ${' '}
                            {formatMoney(item.priceCents)}
                          </span>
                        </span>
                        {item.depositType !== 'none' ? (
                          <Badge tone="info">{depositLabel(item)}</Badge>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="overflow-hidden">
                <StepHeader step={2} title="Elegí el día" />
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setMonthKey(addMonthsToMonthKey(monthKey, -1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground transition hover:bg-background hover:text-foreground"
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="text-sm font-semibold text-foreground">
                      {monthKey ? formatMonthLabel(monthKey) : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setMonthKey(addMonthsToMonthKey(monthKey, 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground transition hover:bg-background hover:text-foreground"
                      aria-label="Mes siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_HEADERS.map((label) => (
                      <span
                        key={label}
                        className="pb-1 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase"
                      >
                        {label}
                      </span>
                    ))}

                    {calendarQuery.isFetching && !calendarQuery.data
                      ? Array.from({ length: 35 }, (_, index) => (
                          <span
                            key={`skeleton-${index}`}
                            className="h-9 animate-pulse rounded-lg bg-accent-soft"
                          />
                        ))
                      : monthCells.map((dateKey, index) => {
                          if (!dateKey) {
                            return <span key={`empty-${index}`} />;
                          }

                          const day = calendarByDate.get(dateKey);
                          const available = Boolean(day?.available);
                          const isPast = Boolean(
                            todayKey && dateKey < todayKey,
                          );
                          const isSelected = dateKey === selectedDate;
                          const disabled = !available || isPast;

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              disabled={disabled}
                              onClick={() => chooseDay(dateKey)}
                              title={
                                available
                                  ? `${day?.slots ?? 0} horarios disponibles`
                                  : 'Sin horarios'
                              }
                              className={cn(
                                'flex h-9 flex-col items-center justify-center rounded-lg text-sm transition',
                                isSelected
                                  ? 'bg-primary font-semibold text-white shadow-sm'
                                  : disabled
                                    ? 'cursor-not-allowed text-subtle-foreground'
                                    : 'bg-accent-soft/60 font-medium text-primary-dark hover:bg-accent-soft',
                              )}
                            >
                              {Number(dateKey.slice(8, 10))}
                              {available && !isSelected ? (
                                <span className="mt-0.5 h-1 w-1 rounded-full bg-primary-hover" />
                              ) : null}
                            </button>
                          );
                        })}
                  </div>

                  {calendarQuery.error ? (
                    <div className="mt-3">
                      <ErrorBanner
                        message={
                          calendarQuery.error instanceof Error
                            ? calendarQuery.error.message
                            : 'No pudimos cargar el calendario.'
                        }
                      />
                    </div>
                  ) : null}

                  <p className="mt-3 text-xs text-subtle-foreground">
                    Los días en gris no tienen horarios disponibles.
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <StepHeader step={3} title="Elegí el horario" />
                <div className="px-5 py-4">
                  {!selectedDate ? (
                    <p className="text-sm text-subtle-foreground">
                      Primero elegí un día en el calendario.
                    </p>
                  ) : availabilityQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-subtle-foreground">
                      <Spinner className="h-4 w-4" />
                      Buscando horarios…
                    </div>
                  ) : (availabilityQuery.data?.slots.length ?? 0) === 0 ? (
                    <p className="text-sm text-subtle-foreground">
                      No quedan horarios para este día. Probá con otra fecha.
                    </p>
                  ) : (
                    <>
                      <p className="mb-3 text-xs font-medium tracking-wide text-subtle-foreground uppercase">
                        {formatDateKeyShort(selectedDate)}
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {(availabilityQuery.data?.slots ?? []).map((slot) => {
                          const active = slot.startsAt === selectedSlot;

                          return (
                            <button
                              key={slot.startsAt}
                              type="button"
                              onClick={() => selectSlot(slot.startsAt)}
                              className={cn(
                                'rounded-xl border px-2 py-2 text-sm font-medium transition',
                                active
                                  ? 'border-primary bg-primary text-white shadow-sm'
                                  : 'border-border bg-surface text-foreground hover:border-primary hover:bg-accent-soft',
                              )}
                            >
                              {formatTimeInZone(slot.startsAt, timezone)}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {availabilityQuery.error ? (
                    <div className="mt-3">
                      <ErrorBanner
                        message={
                          availabilityQuery.error instanceof Error
                            ? availabilityQuery.error.message
                            : 'No pudimos cargar los horarios.'
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="lg:sticky lg:top-6">
                <StepHeader step={4} title="Tus datos" />
                <div className="space-y-4 px-5 py-4">
                  {customer ? (
                    <div className="flex items-start gap-2 rounded-xl border border-accent-soft bg-accent-soft/70 px-3 py-2.5 text-xs text-primary-dark">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Reservás con tu cuenta ({customer.email}). El turno va a
                        quedar en{' '}
                        <Link
                          href="/cliente/turnos"
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          Mis turnos
                        </Link>
                        .
                      </span>
                    </div>
                  ) : null}

                  <div className="rounded-xl bg-background px-3 py-2.5 text-sm">
                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      {selectedDate
                        ? formatDateKeyLong(selectedDate)
                        : 'Elegí día y horario'}
                    </p>
                    <p className="mt-1 text-xs text-subtle-foreground">
                      {selectedSlot
                        ? `${formatTimeInZone(selectedSlot, timezone)} · ${service?.name ?? ''}`
                        : 'Todavía no elegiste un horario'}
                    </p>
                    {service ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-subtle-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        {depositLabel(service)} · ${' '}
                        {formatMoney(service.priceCents)}
                      </p>
                    ) : null}
                  </div>

                  {mutation.error ? (
                    <ErrorBanner
                      message={
                        slotTaken
                          ? 'Ese horario se acaba de ocupar. Actualizamos la disponibilidad: elegí otro horario.'
                          : mutation.error instanceof ApiError
                            ? mutation.error.message
                            : 'No pudimos enviar la reserva.'
                      }
                    />
                  ) : null}

                  <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit((values) =>
                      mutation.mutate(values),
                    )}
                  >
                    <Field
                      label="Nombre y apellido"
                      htmlFor="booking-name"
                      error={form.formState.errors.customerName?.message}
                    >
                      <Input
                        id="booking-name"
                        autoComplete="name"
                        placeholder="Ana Pérez"
                        readOnly={Boolean(customer)}
                        className={customer ? 'bg-background text-subtle-foreground' : undefined}
                        {...form.register('customerName')}
                      />
                    </Field>

                    <Field
                      label="Teléfono"
                      htmlFor="booking-phone"
                      error={form.formState.errors.customerPhone?.message}
                    >
                      <Input
                        id="booking-phone"
                        autoComplete="tel"
                        placeholder="+54 11 5555 0000"
                        readOnly={Boolean(customer)}
                        className={customer ? 'bg-background text-subtle-foreground' : undefined}
                        {...form.register('customerPhone')}
                      />
                    </Field>

                    <Field
                      label="Email (opcional)"
                      htmlFor="booking-email"
                      error={form.formState.errors.customerEmail?.message}
                    >
                      <Input
                        id="booking-email"
                        type="email"
                        autoComplete="email"
                        placeholder="ana@email.com"
                        readOnly={Boolean(customer)}
                        className={customer ? 'bg-background text-subtle-foreground' : undefined}
                        {...form.register('customerEmail')}
                      />
                    </Field>

                    <Field
                      label="Comentarios (opcional)"
                      htmlFor="booking-notes"
                      error={form.formState.errors.notes?.message}
                    >
                      <Textarea
                        id="booking-notes"
                        rows={3}
                        placeholder="Algo que el negocio deba saber"
                        {...form.register('notes')}
                      />
                    </Field>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!canSubmit}
                      loading={mutation.isPending}
                    >
                      Solicitar turno
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <p className="text-center text-xs text-subtle-foreground">
                      El turno queda pendiente hasta que el negocio lo confirme.
                    </p>
                    {business.cancellationHours > 0 ? (
                      <p className="text-center text-xs text-subtle-foreground">
                        Para cancelar, avisá con {business.cancellationHours} h
                        de anticipación.
                      </p>
                    ) : null}
                    {customerStatus === 'anonymous' ? (
                      <p className="text-center text-xs text-subtle-foreground">
                        ¿Querés reservar más rápido la próxima vez?{' '}
                        <Link
                          href="/cliente/registro"
                          className="font-medium text-primary hover:text-primary-hover"
                        >
                          Creá tu cuenta
                        </Link>
                        .
                      </p>
                    ) : null}
                  </form>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-primary">
        {step}
      </span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-subtle-foreground">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium break-words text-foreground">
        {value}
      </dd>
    </div>
  );
}

function depositLabel(item: {
  depositType: 'none' | 'fixed' | 'percentage';
  depositValue: number;
  priceCents: number;
}): string {
  if (item.depositType === 'fixed') {
    return `Seña $ ${formatMoney(item.depositValue)}`;
  }

  if (item.depositType === 'percentage') {
    const amount = Math.round((item.priceCents * item.depositValue) / 100);

    return `Seña ${item.depositValue}% ($ ${formatMoney(amount)})`;
  }

  return 'Sin seña';
}

function contactDefaults(
  customer: { name: string; phone: string; email: string } | null,
): PublicBookingFormValues {
  return {
    customerName: customer?.name ?? '',
    customerPhone: customer?.phone ?? '',
    customerEmail: customer?.email ?? '',
    notes: '',
  };
}

function toPublicAppointment(
  appointment: CustomerAppointment,
  customerName: string,
): PublicAppointment {
  return {
    id: appointment.id,
    status: appointment.status,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    serviceName: appointment.serviceName,
    staffName: appointment.staffName,
    priceCents: appointment.priceCents,
    depositType: appointment.depositType,
    depositValue: appointment.depositValue,
    customerName,
    business: {
      name: appointment.business.name,
      slug: appointment.business.slug,
      timezone: appointment.business.timezone,
    },
  };
}
